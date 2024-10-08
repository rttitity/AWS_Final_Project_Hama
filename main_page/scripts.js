// AWS Cognito 및 S3 설정
AWS.config.update({
    region: 'ap-northeast-2',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'ap-northeast-2:0c52fbc2-029c-40f7-8bd6-49680ea4a815'
    })
});

var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: "hama-web-bucket" }
});

// AWS API Gateway 설정 (Lambda와 연결)
const apiGatewayUrl = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/User_Data"; // User_Data API Gateway URL
const lambdaUrl = 'https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/get_xconomy'; // 재화정보 RDS API Gateway의 URL

// UUID 생성 함수 추가
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 공통으로 사용할 Cognito Pool Data (중복 제거)
const poolData = {
    UserPoolId: 'ap-northeast-2_X3lYDAFiw', // 사용자 풀 ID
    ClientId: '6jlvvpfhkaqhbc0a6l9avmam2u', // 클라이언트 ID
};

// 사용자를 Change Profile 페이지로 리다이렉트
function redirectToChangeProfile() {
    window.location.href = "./change_profile.html";
}

// 사용자 프로필 로드 함수 (프로필 페이지)
function loadUserProfile() {
    getCurrentUserEmail(function(email) {
        document.getElementById('user-email').textContent = email;

        // DynamoDB에서 사용자 프로필 이미지 URL과 코멘트, article_id 가져오기
        fetch(`${apiGatewayUrl}?email=${email}`, {
            method: "GET",
        })
        .then(response => response.json())
        .then(data => {

            // 닉네임이 있으면 표시
            if (data.minecraft_username) {
                document.getElementById('minecraft-username').textContent = data.minecraft_username;
                
                // 닉네임으로 RDS에서 재화 정보 가져오기
                fetch(`${lambdaUrl}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        minecraft_username: data.minecraft_username
                    })
                })
                .then(response => response.json())
                .then(balanceData => {
                    if (balanceData.balance) {
                        document.querySelector('.server-description').textContent = `${balanceData.balance} gold`;
                    } else {
                        document.querySelector('.server-description').textContent = 'Balance not available';
                    }
                })
                .catch(error => console.error('Error fetching balance:', error));
            } else {
                document.getElementById('minecraft-username').textContent = 'No username available';
            }

            if (data.profileImageUrl) {
                // 사용자 프로필 이미지가 있으면 그걸 사용
                document.getElementById('profile-picture').src = data.profileImageUrl;
            } else {
                // 프로필 이미지가 없으면 기본 이미지 사용
                document.getElementById('profile-picture').src = "https://hama-web-bucket.s3.ap-northeast-2.amazonaws.com/User_Data/no_email/no_profile_image.png";
            }

            // 코멘트가 있으면 사용, 없으면 기본 메시지 출력
            document.getElementById('current-comment').textContent = data.profilecoment || "No comment available.";

            // article_id를 로컬 스토리지에 저장 (로그인 후 유지)
            if (data.article_id) {
                localStorage.setItem('article_id', data.article_id);
            }
        })
        .catch(error => console.error('Error fetching profile data:', error));
    });
}

// Game Start 및 Community 버튼 이벤트 처리 추가
document.addEventListener("DOMContentLoaded", function() {
    // 사용자 버튼 로드
    const userDataButton = document.getElementById('userDataButton');
    if (userDataButton) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            userDataButton.textContent = 'User Data';
            userDataButton.onclick = function() {
                window.location.href = 'user_data.html';
            };
        } else {
            userDataButton.textContent = 'Login';
            userDataButton.onclick = function() {
                window.location.href = '../login_page/login.html';
            };
        }
    }

    // Game Start 버튼 처리
    const gameStartButton = document.getElementById('gameStartButton');
    if (gameStartButton) {
        gameStartButton.addEventListener('click', function() {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn !== 'true') {
                alert("로그인 후 이용해주세요");
            } else {
                // Minecraft 실행 코드
                var url = "minecraft://";
                var exec = document.createElement("a");
                exec.setAttribute("href", url);
                exec.click();
            }
        });
    }

    // Community 버튼 처리
    const communityLink = document.getElementById('communityLink');
    if (communityLink) {
        communityLink.addEventListener('click', function(event) {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn !== 'true') {
                event.preventDefault();
                alert("로그인 후 이용해주세요");
            } else {
                window.location.href = '../bulletin/article_view.html';
            }
        });
    }

    // Ranking 버튼 처리
    const RankingLink = document.getElementById('RankingLink');
    if (RankingLink) {
        RankingLink.addEventListener('click', function(event) {
            const isLoggedIn = localStorage.getItem('isLoggedIn');
            if (isLoggedIn !== 'true') {
                event.preventDefault();
                alert("로그인 후 이용해주세요");
            } else {
                window.location.href = '/Ranking_page/Ranking.html';
            }
        });
    }

    // 로그아웃 버튼 처리 (로그아웃 시 로컬 스토리지에서 article_id 제거)
    const logoutButton = document.querySelector('.logout_btn');
    if (logoutButton) {
        logoutButton.addEventListener("click", function() {
            const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
            const cognitoUser = userPool.getCurrentUser();
            if (cognitoUser != null) {
                cognitoUser.getSession((err, session) => {
                    if (err) {
                        console.error('Session error: ', err);
                        return;
                    }
                    cognitoUser.signOut(); // 사용자 로그아웃
                    localStorage.removeItem('isLoggedIn'); // 로컬스토리지에서 로그인 정보 제거
                    localStorage.removeItem('article_id');  // article_id 제거
                    localStorage.removeItem('username');
                    window.location.href = 'index.html'; // 로그인 페이지로 리디렉션
                });
            }
        });
    }

    // 스플래시 텍스트 로드
    const splashTextElement = document.getElementById("splash-text");
    if (splashTextElement) {
        splashTextElement.innerText = getRandomSplashText();
    }

    // 사용자 프로필 로드
    loadUserProfile();
});

// 사용자 이메일 정보 가져오기
function getCurrentUserEmail(callback) {
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    const cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession((err, session) => {
            if (err) {
                console.log("Session error: ", err);
                return;
            }
            cognitoUser.getUserAttributes((err, attributes) => {
                if (err) {
                    console.log("Attribute error: ", err);
                    return;
                }

                const emailAttribute = attributes.find(attr => attr.getName() === 'email');
                const email = emailAttribute ? emailAttribute.getValue() : null;

                if (callback) {
                    callback(email);
                }
            });
        });
    } else {
        console.log("No current user");
    }
}

// 스플래시 텍스트 문구 리스트
const splashTexts = [
    "Wow, such Minecraft!",
    "Hello, World!",
    "Block-tastic!",
    "Creeper? Oh man!",
    "100% renewable!",
    "Exciting!",
    "Best game ever!",
    "Ender Dragon awaits!",
    "Now with extra blocks!",
    "Infinite worlds!",
    "Welcome Hama Server"
];

// 문구를 랜덤으로 선택하는 함수
function getRandomSplashText() {
    const randomIndex = Math.floor(Math.random() * splashTexts.length);
    return splashTexts[randomIndex];
}

// DOM이 로드되면 스플래시 텍스트 표시
window.onload = function() {
    const splashTextElement = document.getElementById("splash-text");
    if (splashTextElement) {
        splashTextElement.innerText = getRandomSplashText();
    }
};

function saveProfileChanges() {
    getCurrentUserEmail(function(email) {
        var files = document.getElementById("new_profile_image").files;
        var profileComment = document.getElementById("new_profile_comment").value;
        var minecraftUsername = document.getElementById("minecraft-username-input").value; // Minecraft Username 가져오기

        // 이미지나 코멘트 또는 Minecraft Username이 없으면 경고
        if (!files.length && !profileComment && !minecraftUsername) {
            return alert("Please upload a profile image, add a comment, or enter your Minecraft username to save changes.");
        }

        // 프로필 이미지가 선택된 경우 S3에 업로드
        if (files.length) {
            var file = files[0];
            var fileName = `User_Data/${email}/profile/${file.name}`;

            var upload = new AWS.S3.ManagedUpload({
                params: {
                    Bucket: "hama-web-bucket",
                    Key: fileName,
                    Body: file,
                    ACL: 'public-read'
                }
            });

            var promise = upload.promise();

            promise.then(
                function(data) {
                    alert("Successfully uploaded profile image.");
                    // Lambda로 데이터 전송하여 업데이트 처리
                    updateProfileDataToLambda(email, data.Location, profileComment, minecraftUsername);
                },
                function(err) {
                    console.log("Error uploading profile image:", err);
                    alert("There was an error uploading your profile image: " + err.message);
                }
            );
        } else {
            // 이미지 업로드 없이 Lambda로 바로 데이터 전송하여 업데이트 처리
            updateProfileDataToLambda(email, null, profileComment, minecraftUsername);
        }
    });
}

// Lambda로 프로필 데이터 전송 (PUT 방식, UPDATE)
function updateProfileDataToLambda(email, profileImageUrl, profileComment, minecraftUsername) {
    const article_id = localStorage.getItem('article_id');  // 로컬 스토리지에서 article_id 가져오기

    if (!article_id) {
        alert('Error: Missing article_id');
        return;
    }

    const data = {
        'article_id': article_id,  // article_id를 사용하여 업데이트
        'email': email,
        'profileImageUrl': profileImageUrl || null,
        'profilecoment': profileComment || null,
        'minecraft_username': minecraftUsername || null,  // Minecraft Username 추가
        'timestamp': new Date().toISOString()
    };

    fetch(apiGatewayUrl, {
        method: "PUT",  // POST 대신 PUT 방식 사용
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)  // 데이터를 JSON으로 변환하여 전송
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                console.error("Error response from server:", err);
                throw new Error("Server responded with an error: " + err.message);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log("Success:", data);
        alert("Profile changes updated successfully.");
        window.location.href = '/main_page/user_data.html';  // 프로필 페이지로 리디렉션
    })
    .catch((error) => {
        console.error("Error:", error);
        alert("There was an error updating your profile changes.");
    });
}

// 이미지 등록 시 파일이 선택되었을 때 텍스트를 업데이트 하는 함수
function updateFileName() {
    const input = document.getElementById('new_profile_image');
    const fileNameDisplay = document.getElementById('file-name');

    if (input.files.length > 0) {
        fileNameDisplay.textContent = input.files[0].name; // 선택된 파일 이름을 출력
    } else {
        fileNameDisplay.textContent = 'Please choose your image'; // 파일이 없을 경우 기본 메시지
    }
}
