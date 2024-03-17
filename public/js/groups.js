function getCookie(name) {
    let matches = document.cookie.match(
        new RegExp(
            "(?:^|; )" +
            name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
            "=([^;]*)"
        )
    );
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
let userData = JSON.parse(getCookie('user'));

const sender_id = userData._id;

let socket = io("/user-namespace", {
    auth: {
        token: sender_id,
    },
});


// ------------------- showing member list -------------------- //
// show member list in a modal whiel clicking Members 
let members = document.getElementsByClassName("addMembers");
// console.dir(members)
for (member of members) {
    member.addEventListener("click", (event) => {
        let group_id = document.getElementById("group_id");
        group_id.value = event.target.id;
        let groupId = event.target.id;
        // console.log(groupId);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/chats/members', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        // Set up the data to send to the server
        const data = `groupId=${groupId}`;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // console.log(response.users)
                        let html = '';
                        for (user of response.users) {
                            html += `<tr>
                            <td>
                                <input type="checkbox" class="memberList" value="${user._id}">
                            </td> 
                            <td>${user.username}</td> 
                            </tr>`
                        }
                        let table = document.getElementById("addMemberInTable");
                        table.innerHTML = "";
                        table.insertAdjacentHTML("beforeend", html);
                    } else {
                        alert(response.message);
                    }
                } else {
                    alert('Error occurred while making the request');
                }
            }
        };
        xhr.send(data);
    })
}


// ------------------ update group member ----------------------- //
// update member to the database
let addMemberButton = document.getElementById("addMemberButton");
addMemberButton.addEventListener("click", () => {
    let group_id = document.getElementById("group_id").value;
    let memberList = document.getElementsByClassName("memberList");
    let addMemberId = [];
    // selecting the user id which are checked
    for(member of memberList) {
        if(member.checked == true){
            addMemberId.push(member.value);   
        }
    }
    // ajax request to update member list
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/chats/addMembers", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // data that will be send to the backend
    let addMemberDetails = {
        group_id: group_id,
        addMemberId: addMemberId
    };
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    window.location.href = "/chats/groups"
                } else {
                    alert(response.success);
                }
            } else {
                alert("Error occurred while making the request");
            }
        }
    };
    let jsonData = JSON.stringify(addMemberDetails);
    xhr.send(jsonData);
})


// ------------------------ copy shareable link -------------------------- //

let copys = document.getElementsByClassName("copy");
for (copy of copys) {
    copy.addEventListener("click", async(event) => {
        let groupId = event.target.id;

        let url = window.location.origin + "/chats/share-group/" + groupId;
        // console.log(url);

        const newSpan = document.createElement("h3");
        newSpan.innerText = "Copied";
        newSpan.classList.add("copied_text");
        let div = document.getElementById("copied_text");
        div.appendChild(newSpan)
        setTimeout(() => {
            div.innerHTML ="";
        }, 1700);

        try {
            // Use the Clipboard API to copy the text to the clipboard
            await navigator.clipboard.writeText(url);
        } catch (err) {
            console.error('Unable to copy URL to clipboard', err);
        } 
    })
}