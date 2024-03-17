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


let btn = document.querySelector(".join");
if(btn) {
    btn.addEventListener("click", () => {
        let groupId = btn.getAttribute("id");
        // console.log(groupId);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/chats/join-group', true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        // Set up the data to send to the server
        const data = `groupId=${groupId}`;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        btn.remove();
                        let h1 = document.createElement("h1");
                        h1.innerText = "Member";
                        h1.classList.add("col-1");
                        h1.classList.add("offset-1");
                        let div = document.querySelector(".row");
                        div.insertAdjacentElement("beforeend", h1);
                        // to reload the page
                        // location.reload();
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