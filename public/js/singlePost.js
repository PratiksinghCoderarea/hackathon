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

// toggle the modal that will take group name if atleast one user is selected
function makeTeam() {
    let checkboxDiv = document.getElementsByClassName("addMemberCheckbox");
    let members = [];
    for (checkbox of checkboxDiv) {
        if (checkbox.checked) {
            members.push(checkbox.id)
        }
    }
    if (members.length == 0) {
        return alert("Select atleast one member")
    }
    let modal = new bootstrap.Modal(document.getElementById('exampleModal'));
    modal.toggle();
    // console.log(members);
}

// make group with and update group members
function makeGroup() {
    let checkboxDiv = document.getElementsByClassName("addMemberCheckbox");
    let members = [];
    for (checkbox of checkboxDiv) {
        if (checkbox.checked) {
            members.push(checkbox.id)
        }
    }
    let name = document.getElementById("groupName").value;
    if(name == "") {
        return alert("Give a group name");
    }
    let postId = document.getElementById("postId").innerText;

    // Set up the data to send to the server
    const data = {
        members: members,
        groupName : name,
        postId: postId
    };
    // console.log(data);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/chats/groups', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    window.location.href = "/chats/dashboard";
                }
            } else {
                alert('Error occurred while making the request');
            }
        }
    };
    let jsondata = JSON.stringify(data);
    xhr.send(jsondata);
}