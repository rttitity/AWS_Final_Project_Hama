const poolData = {
    UserPoolId: 'ap-northeast-2_X3lYDAFiw', // 사용자 풀 ID
    ClientId: '6jlvvpfhkaqhbc0a6l9avmam2u', // 클라이언트 ID
};

// AWS API Gateway 설정 (Lambda와 연결)
const apiGatewayUrl = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/User_Data"; // API Gateway URL

// UUID 생성 함수 추가
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function main() {
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser(); 

    const currentUserData = {};

    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.log(err);
                location.href = "login.html";
            } else {
                cognitoUser.getUserAttributes((err, result) => {
                    if (err) {
                        location.href = "login.html";
                    } 

                    for (let i = 0; i < result.length; i++) {
                        currentUserData[result[i].getName()] = result[i].getValue();
                    }

                    document.getElementById("email").value = currentUserData["email"];

                    const signoutButton = document.getElementById("signout");
                    signoutButton.addEventListener("click", event => {
                        cognitoUser.signOut();
                        localStorage.removeItem('isLoggedIn'); // 로그아웃 시 localStorage에서 제거
                        localStorage.removeItem('username');
                        location.reload();
                    });
                    signoutButton.hidden = false;
                });
            }
        });
    } else {
        location.href = "login.html";
    }
}


// signup.html
function SignUp() {
    var username = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

     // 이메일 속성을 추가합니다.
    var attributeList = [];
    var dataEmail = {
        Name: 'email',
        Value: username
    };
    
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);

    userPool.signUp(username, password, attributeList, null, function(err) {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        window.location.href = 'confirm.html';
    });         
}

// 회원가입 완료 후 확인 (Confirm)
function ConfirmRegistration() {
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var username = document.getElementById("email").value;
    var code = document.getElementById("ConfirmCode").value;
    var userData = {
        Username: username,
        Pool: userPool,
    };
    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        console.log('call result: ' + result);

        // DynamoDB에 사용자 데이터 POST (UUID, 이메일 등록)
        const article_id = uuidv4(); // UUID 생성
        const Item = {
            'article_id': article_id,  
            'email': username,
            'profileImageUrl': null,  
            'profilecoment': null,  
            'minecraft_username': null,  
            'timestamp': new Date().toISOString()
        };

        // POST 요청을 통해 DynamoDB에 사용자 데이터 저장
        fetch(apiGatewayUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(Item)
        })
        .then(response => response.json())
        .then(data => {
            console.log("Success:", data);
            window.location.href = 'welcome.html'; // 확인 후 리디렉션
        })
        .catch((error) => {
            console.error("Error:", error);
            alert("There was an error saving your profile data.");
        });
    });
}

// login.html
function Login() {
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var username = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    var authenticationData = {
        Username: username,
        Password: password,
    };

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
        authenticationData
    );
    var userData = {
        Username: username,
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            var idToken = result.getIdToken().getJwtToken();          // ID 토큰
            var accessToken = result.getAccessToken().getJwtToken();  // 액세스 토큰
            var refreshToken = result.getRefreshToken().getToken();   // 갱신 토큰

            console.log("idToken : " + idToken);
            console.log("accessToken : " + accessToken);
            console.log("refreshToken : " + refreshToken);

            window.location.href = 'main.html';
        },

        onFailure: function(err) {
            // 로그인에 실패 했을 경우 에러 메시지 표시
            console.log(err);
            alert("로그인 실패")
        }
    });
}



// Minecraft 데이터 DynamoDB 업로드 함수
function uploadMinecraftData() {
    var minecraftUsername = document.getElementById("minecraft_username").value;

    // 이메일은 Cognito에서 가져온다 (이메일이 사용자 풀에 저장되어 있다고 가정)
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if (err) {
                console.log(err);
                alert("Session error, please log in again.");
                window.location.href = "login.html";
            } else {
                // 유저 속성에서 이메일을 가져옴
                cognitoUser.getUserAttributes(function(err, attributes) {
                    if (err) {
                        console.log(err);
                    } else {
                        var email = attributes.find(attr => attr.Name === "email").Value;
                        
                        // 이메일과 Minecraft 닉네임을 Lambda로 전송
                        checkAndUpdateProfile(email, minecraftUsername);
                    }
                });
            }
        });
    } else {
        alert("No user is logged in. Please log in again.");
        window.location.href = "login.html";
    }
}

// **수정된 부분**
// 기존 프로필이 있는지 확인한 후 없으면 POST, 있으면 PUT
function checkAndUpdateProfile(email, minecraftUsername) {
    fetch(`${apiGatewayUrl}?email=${email}`, { method: 'GET' })
    .then(response => {
        if (response.status === 404) {
            // 프로필이 없으면 POST (새로 만들기)
            sendProfileDataToLambda(email, minecraftUsername, "POST");
        } else {
            // 프로필이 있으면 PUT (업데이트)
            sendProfileDataToLambda(email, minecraftUsername, "PUT");
        }
    })
    .catch(error => {
        console.error('Error checking profile:', error);
    });
}

// **수정된 부분**
// Lambda로 이메일과 Minecraft 사용자 이름 전송
function sendProfileDataToLambda(email, minecraftUsername, method) {
    const article_id = uuidv4(); // UUID로 article_id 생성

    const Item = {
        'article_id': article_id,  // article_id 추가
        'email': email,
        'minecraft_username': minecraftUsername || null, // Minecraft 사용자 이름
        'profileImageUrl': null,  // 기본값은 null
        'profilecoment': null,  // 기본값은 null
        'timestamp': new Date().toISOString()
    };

    fetch(apiGatewayUrl, {
        method: method, // POST 또는 PUT에 따라 요청 방식 설정
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(Item)  // 데이터를 JSON으로 변환하여 전송
    })
    .then(response => response.json())
    .then(data => {
        console.log("Success:", data);
        alert("Profile changes saved successfully.");
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("There was an error saving your profile changes.");
    });
}
