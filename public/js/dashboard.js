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
let receiver_id;

let socket = io("/user-namespace", {
    auth: {
        token: sender_id,
    },
});

let formInput = document.getElementById("conversation-main-message");
formInput.addEventListener("keypress", (event) => {
    if (event.key == "Enter") {
        submitForm();
    }
})

function submitForm() {
    let inputMessage = document.getElementById("conversation-main-message");
    let message = inputMessage.value.trim();
    // console.log(message)
    if (message == "") {
        inputMessage.value = "";
        return;
    }
    // console.log(message);

    // send request to the server to show interest
    // Make an AJAX request to the server
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/chats/saveChat", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    let chatData = {
        receiver_id: receiver_id,
        sender_id: sender_id,
        message: message,
    };
    inputMessage.value = "";

    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    let typing = document.getElementById("typing");
                    let chat = response.data.message;
                    html = `<li class="conversation-item me">
                                <div class="conversation-item-wrapper">
                                    <div class="conversation-item-box">
                                        <div class="conversation-item-text">
                                            <p id=${response.data._id}>${chat}</p>
                                            <i class="ri-check-double-line" ></i>
                                        </div>
                                    </div>
                                </div>
                            </li>`;
                    let chatContainer = document.getElementById("conversation-main-container");
                    chatContainer.insertAdjacentHTML("beforeend", html);
                    // if typing exists then insert before typing
                    if (typing) {
                        typing.remove();
                    }
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    // send current chat on the receiver side
                    socket.emit("newChat", response.data);
                } else {
                    alert(response.message);
                }
            } else {
                alert("Error occurred while making the request");
            }
        }
    };
    // Send the request with the data
    let jsonData = JSON.stringify(chatData);
    xhr.send(jsonData);
}

// save message to database
let btn = document.getElementById("conversation-form-button")
btn.addEventListener("click", () => {
    submitForm();
})

// search user by username and start 
let searchButton = document.getElementById("search-user-btn-conversation-default");
let searchInputField = document.getElementById("search-user-conversation-default");
searchButton.addEventListener("click", () => {
    let username = searchInputField.value;
    // console.log(username);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/chats/searchUser', true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    // Set up the data to send to the server
    const data = `username=${username}`
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // console.log(response);
                    let status;
                    if (response.user.is_online == "1") {
                        status = `<sup class="online-status" id="${response.user._id}-status">Online</sup>`
                    } else {
                        status = `<sup class="offline-status" id="${response.user._id}-status">Offline</sup>`
                    }
                    let html = `<li id="${response.user._id}" onclick="showDashboard('${response.user._id}', '${response.user.username}', '${response.user.profile_image.url}')">
                    <a >
                        <img class="content-message-image" src="${response.user.profile_image.url}" alt="" id=""/>
                        <span class="content-message-info mb-2"> 
                            <div id="${response.user._id}"></div>
                            <span class="content-message-name" >${response.user.username}</span>
                        </span>
                      <span class="content-message-more">
                        <span>
                          ${status}
                        </span>
                      </span>
                    </a>
                  </li>`
                    let chatContainer = document.getElementById("user-list");
                    chatContainer.insertAdjacentHTML("beforeend", html);
                } else {
                    // console.log(response);
                }
            } else {
                alert('Error occurred while making the request');
            }
        }
    }
    // Send the request with the data
    xhr.send(data);
})

// let form = document.getElementById("chat-form");
// form.addEventListener("submit", (event) => {
//     event.preventDefault();
//     console.log("working");
// let inputMessage = document.getElementById("message");
// let message = inputMessage.value;

// // send request to the server to show interest
// // Make an AJAX request to the server
// const xhr = new XMLHttpRequest();
// xhr.open("POST", "/chats/saveChat", true);
// xhr.setRequestHeader("Content-Type", "application/json");

// let chatData = {
//     receiver_id: receiver_id,
//     sender_id: sender_id,
//     message: message,
// };
// inputMessage.value = "";

// xhr.onreadystatechange = function () {
//     if (xhr.readyState === XMLHttpRequest.DONE) {
//         if (xhr.status === 200) {
//             const response = JSON.parse(xhr.responseText);
//             if (response.success) {
//                 let chat = response.data.message;
//                 let html = `<div class="curr-user-chat"><h5>${chat}</h5></div>`;
//                 let chatContainer = document.getElementById("chat-container");
//                 chatContainer.insertAdjacentHTML("beforeend", html);
//                 chatContainer.scrollTop = chatContainer.scrollHeight;
//                 // send current chat on the receiver side
//                 socket.emit("newChat", response.data);
//             } else {
//                 alert(response.message);
//             }
//         } else {
//             alert("Error occurred while making the request");
//         }
//     }
// };
// // Send the request with the data
// let jsonData = JSON.stringify(chatData);
// xhr.send(jsonData);
// });

// show chat area
function showDashboard(userId, username, profile_image) {
    let conversation = document.getElementById("conversation-1");
    let conversationDefault = document.getElementById("conversation-default");

    conversationDefault.setAttribute("hidden", false);
    conversation.removeAttribute("hidden");

    // when max width 767px, then hide chat-sidebar and content-sidebar
    let x = window.matchMedia("(max-width: 767px)")
    if (x.matches) {
        let chatSidebar = document.getElementById("chat-sidebar");
        let contentSidebar = document.getElementById("content-sidebar");

        contentSidebar.setAttribute("hidden", false);
        chatSidebar.setAttribute("hidden", false);
    }

    receiver_id = document.getElementById(userId).getAttribute("id");
    // console.log(receiver_id);

    let topUsername = document.getElementById("conversation-top-username");
    topUsername.innerText = username
    document.getElementById("conversation-top-image").setAttribute("src", profile_image);

    // set 
    let statusTop = document.getElementById("conversation-top-status");
    let statusUser = document.getElementById(userId + "-status");
    statusTop.innerText = statusUser.firstElementChild.innerText;

    if (statusTop.innerText == "Offline") {
        statusTop.classList.remove("online");
        statusTop.classList.add("offline")
    } else if (statusTop.innerText == "Online") {
        statusTop.classList.remove("offline");
        statusTop.classList.add("online");
    }

    socket.emit("getChats", { receiver_id, sender_id });
}

function conversationBack() {
    let chatSidebar = document.getElementById("chat-sidebar");
    let contentSidebar = document.getElementById("content-sidebar");

    contentSidebar.removeAttribute("hidden");
    chatSidebar.removeAttribute("hidden");

    let chatContainer = document.getElementById("conversation-main-container");
    let inputMessage = document.getElementById("conversation-main-message");
    // clear the old chat fromm the chat container and also clearing the input field
    chatContainer.innerHTML = "";
    inputMessage.value = "";
}

// when get a user online 
socket.on("getOnlineUser", (data) => {
    let status = document.getElementById(data + "-status");
    status.classList.remove("offline-status");
    status.classList.add("online-status");

    status.firstElementChild.innerText = "Online";

    if (data == receiver_id) {
        let statusTop = document.getElementById("conversation-top-status");
        statusTop.innerText = "Online";

        statusTop.classList.remove("offline");
        statusTop.classList.add("online");

    }
});

// when get a user offline 
socket.on("getOfflineUser", (data) => {
    let status = document.getElementById(data + "-status");
    status.classList.remove("online-status");
    status.classList.add("offline-status");

    status.firstElementChild.innerText = "Offline";

    if (data == receiver_id) {
        let statusTop = document.getElementById("conversation-top-status");
        statusTop.innerText = "Offline";

        statusTop.classList.remove("online");
        statusTop.classList.add("offline");
    }
});

// load current chat on the receiver side
socket.on("loadNewChat", (data) => {
    if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
        let typing = document.getElementById("typing");
        let html = `<li class="conversation-item">
                        <div class="conversation-item-wrapper">
                            <div class="conversation-item-box">
                                <div class="conversation-item-text">
                                    <p id=${data._id}>${data.message}</p>
                                    <p hidden>seen</p>
                                </div>
                            </div>
                        </div>
                    </li>`;
        let chatContainer = document.getElementById("conversation-main-container");
        chatContainer.insertAdjacentHTML("beforeend", html);
        if (typing) {
            typing.remove();
        }
        chatContainer.scrollTop = chatContainer.scrollHeight;
        observerNewChat.observe(document.getElementById(data._id));
    }
    // in the else case means when user not open the sender chat dashboard then send notification
});

socket.on("loadChats", (data) => {
    let chatContainer = document.getElementById("conversation-main-container");
    let inputMessage = document.getElementById("conversation-main-message");
    // clear the old chat fromm the chat container and also clearing the input field
    chatContainer.innerHTML = "";
    inputMessage.value = "";

    let chats = data;
    for (chat of chats) {
        let html;
        let isSeen;
        if (chat.isSeen == true) {
            isSeen = '<i class="ri-check-double-line" style = "color:#ecb81d;" ></i>';
        } else if (chat.isSeen == false) {
            isSeen = `
            <i class="ri-check-double-line" style="color:white;"></i>`;
        }
        if (chat.sender_id == sender_id) {

            html = `<li class="conversation-item me">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text" >
                               <div class="message"><p id=${chat._id}>${chat.message}</p></div>
                               <div class="check">
                                ${isSeen}
                                </div>
                               </div>
                        </div>
                    </div></li>`;
        } else {
            html = `<li class="conversation-item">
                        <div class="conversation-item-wrapper">
                            <div class="conversation-item-box">
                                <div class="conversation-item-text">
                                <div class="message"><p id=${chat._id}>${chat.message}</p></div>
                                <div class="check" hidden>
                                ${isSeen}
                                </div>
                            </div>
                        </div>
                    </li>`;
        }

        chatContainer.insertAdjacentHTML("beforeend", html);
    }
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // check the last element is send by the current user or not 
    // if not send by current user then check already seen or not
    // if unseen then

    let text = document.getElementById("conversation-main-container").lastChild;
    if (text) {
        if (!text.className.includes("me")) {
            // console.log(text)
            let child = text.children[0].children[0].children[0];
            // console.dir(child.children[1].innerText)
            // console.dir(child.children[0])
            if (child.children[1].innerText == "unseen") {
                observerOldChat.observe(document.getElementById(child.children[0].id));
            }
        }
    }
});

let lastTyping;
// when sender will start typing send typing alert to the receiver
let inputField = document.getElementById("conversation-main-message");
inputField.addEventListener("keyup", () => {
    lastTyping = new Date();
    // when user will not type for 5 second then send stop typing alert
    setTimeout(() => {
        let currentDate = new Date();
        let timeDifference = currentDate - lastTyping;
        let secondsDifference = Math.floor(timeDifference / 1000);
        if (secondsDifference >= 4) {
            socket.emit("stop-typing", { receiver_id, sender_id });
        }
    }, 4500);
    socket.emit("typing", { receiver_id, sender_id });
});


// catch typing 
socket.on("typing-receiver", (data) => {
    // when receiver will also open the sender screen then it will work
    if (receiver_id == data.sender_id) {
        let typing = document.getElementById("typing");
        if (!typing) {
            let html = `<li class="conversation-item" id="typing">
            <div class="conversation-item-wrapper">
                        <div class="conversation-item-box">
                            <div class="conversation-item-text">
                                <div class="dot-container">
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                    <div class="dot"></div>
                                </div>
                            </div>
                        </div>
                    </div></li>`;
            let chatContainer = document.getElementById("conversation-main-container");
            chatContainer.insertAdjacentHTML("beforeend", html);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }
});

// catch typing 
socket.on("stop-typing-receiver", (data) => {
    // when receiver will also open the sender screen then it will work
    if (receiver_id == data.sender_id) {
        let typing = document.getElementById("typing");
        if (typing) {
            typing.remove();
        }
    }
});

// ------------------------- seen and unseen feature -------------------------
const observerNewChat = new window.IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
        // Send a message to the server that the user has viewed the message.
        socket.emit('read-current-message', entry.target.id);
        return;
    }
}, {
    root: null,
    threshold: 0.1,
});

const observerOldChat = new window.IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
        console.log(entry)
        // Send a message to the server that the user has viewed the message.
        socket.emit('read-old-message', entry.target.id);
        return;
    }
}, {
    root: null,
    threshold: 0.1,
});

socket.on("read-current-send-message", (data) => {
    let chatContainer = document.getElementById("conversation-main-container");
    let chat = document.getElementById(data);
    let nextElement = chat.nextElementSibling;
    nextElement.remove();
    chat.insertAdjacentHTML("afterend", '<i class="ri-check-double-line" style="color:green;"></i>');
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on("seen-old-chat", (data) => {
    let chatContainer = document.getElementById("conversation-main-container");
    let chat = document.getElementById(data);
    let nextElement = chat.nextElementSibling;
    nextElement.remove();
    chat.insertAdjacentHTML("afterend", "<p hidden>seen</p>");
    chatContainer.scrollTop = chatContainer.scrollHeight;
});