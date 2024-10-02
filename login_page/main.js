const poolData = {
    UserPoolId: 'ap-northeast-2_IV1XOFUcn', // 사용자 풀 ID
    ClientId: '5lgtssohmht73jqrpl259obu1v', // 클라이언트 ID
};

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
    var username = document.getElementById("Username").value;
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;
    
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    // 이메일과 이름 속성을 추가합니다.
    var attributeList = [];
    
    // 이메일 속성
    var dataEmail = {
        Name: 'email',
        Value: email
    };
    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);

    // 사용자 이름 속성
    var dataName = {
        Name: 'name',
        Value: username  // 필수 속성 추가
    };
    var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
    attributeList.push(attributeName);

    userPool.signUp(username, password, attributeList, null, function(err, result) {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }
        window.location.href = 'confirm.html';
    });         
}



// confirm.html
function ConfirmRegistration() {
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    // 이메일을 인증에 사용
    var email = document.getElementById("email").value;  // 이메일로 인증
    var code = document.getElementById("ConfirmCode").value;   // 확인 코드

    // 사용자 풀에서 유저 데이터를 생성합니다.
    var userData = {
        Username: email,  // 이메일을 기반으로 인증
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    // 인증 코드를 확인하는 API 호출
    cognitoUser.confirmRegistration(code, true, function(err, result) {
        if (err) {
            alert(err.message || JSON.stringify(err));
            return;
        }

        window.location.href = 'login.html'; // 인증 성공 시 로그인 페이지로 리디렉션
    });
}



// login.html
function Login() {
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    // 유저의 이메일과 비밀번호를 입력받습니다.
    var email = document.getElementById("email").value;  // 이메일로 로그인
    var password = document.getElementById("password").value;

    // 인증 데이터 생성
    var authenticationData = {
        Username: email,    // Cognito에서 Username 필드로 이메일 사용
        Password: password,
    };

    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var userData = {
        Username: email,    // 여기도 이메일을 Username으로 사용
        Pool: userPool,
    };

    var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    // 사용자 인증 요청
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function (result) {
            // 인증 성공 시 토큰 처리
            var idToken = result.getIdToken().getJwtToken();          // ID 토큰
            var accessToken = result.getAccessToken().getJwtToken();  // 액세스 토큰
            var refreshToken = result.getRefreshToken().getToken();   // 갱신 토큰

            console.log("idToken : " + idToken);
            console.log("accessToken : " + accessToken);
            console.log("refreshToken : " + refreshToken);

            // 로그인 성공 시 메인 페이지로 이동
            window.location.href = 'main.html';
        },

        onFailure: function(err) {
            // 로그인 실패 시 오류 메시지 출력
            console.log(err);
            alert("로그인 실패");
        }
    });
}
