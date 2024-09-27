var albumBucketName = "hama-web-bucket";
var bucketRegion = "ap-northeast-2";
var IdentityPoolId = "ap-northeast-2:0c52fbc2-029c-40f7-8bd6-49680ea4a815";
let currentPage = 1;
const articlesPerPage = 10;

let article_arr = [];

// API Gateway에서 제공되는 URL, GSI에서 title을 기준으로 게시물 로드
const URL = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/article_resource";

// 게시물 목록을 가져오는 함수, 이제 GSI를 통해 title을 기준으로 가져옴
function getArticles() {
    fetch(URL, {
        method: "GET",
        headers: {
            'Accept': 'application/json'
        }
    })
    .then(resp => resp.json())  // 응답을 JSON 형식으로 파싱
    .then(function(data) {
        article_arr = data.Items;  // GSI에서 title로 반환된 게시물 목록을 저장

        // 게시물을 최신순으로 정렬 (timestamp 기준) 
        article_arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        displayArticles(article_arr);  // 정렬된 게시물을 화면에 표시
    })
    .catch(err => console.log(err));  // 오류가 발생하면 콘솔에 출력
}

// 게시물 목록을 화면에 표시하는 함수
function displayArticles(articles) {
    const articlesList = document.getElementById('articles');  // 게시물을 표시할 ul 태그 선택
    articlesList.innerHTML = '';  // 기존에 표시된 게시물 목록 초기화

    articles.forEach(function(article) {  // 각 게시물에 대해 반복 처리
        let li = document.createElement('li');  // 새로운 li 태그 생성
        li.classList.add('article-item');  // CSS 클래스 추가

        li.innerHTML = `
            <img src="${article.img_source}" alt="${article.title}" class="article-image">
            <div class="article-view-content">
                <h3>${article.title}</h3>
                <p>작성자: ${article.author}</p>
                <p>작성 시간: ${new Date(article.timestamp).toLocaleString()}</p>
            </div>
        `;  // 게시물 제목, 작성자, 작성 시간, 대표 이미지를 li에 표시

        li.onclick = function() {  // 클릭 시 상세 페이지로 이동
            viewArticleDetail(article.article_id);  // 게시물 상세 페이지로 이동
        };

        articlesList.appendChild(li);  // 생성한 li를 ul 태그에 추가하여 화면에 표시
    });
    // 페이지네이션 업데이트 (필요 시)
    //updatePagination(articles.length, page);
}


    

// 게시물 상세 정보를 가져오는 함수
function getArticleDetail() {
    const params = new URLSearchParams(window.location.search);
    const article_id = params.get('id');  // URL에서 article_id 추출

    if (article_id) {
        // 서버에서 특정 article_id로 GET 요청
        fetch(URL + '?article_id=' + article_id, {
            method: "GET",
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(resp => resp.json())
        .then(function(data) {
            const articles = data.Items;  // 배열 형식의 Items 반환

            if (articles && articles.length > 0) {
                // article_id로 정확히 일치하는 게시물 찾기
                let article = articles.find(item => item.article_id === article_id);

                if (article) {
                    // 해당 게시물의 정보를 화면에 표시
                    document.getElementById('article-title').textContent = article.title;
                    document.getElementById('article-content').textContent = article.content;
                    document.getElementById('article-image').src = article.img_source;
                } else {
                    alert('해당 ID의 게시물을 찾을 수 없습니다.');
                }
            } else {
                alert('게시글을 찾을 수 없습니다.');
            }
        })
        .catch(err => console.log(err));  // 오류 발생 시 로그 출력
    } else {
        alert('Invalid article ID');  // URL에 article_id가 없을 경우 경고
    }
}

// 게시물 목록 페이지로 이동하는 함수
function goToArticleList() {
    window.location.href = 'article_view.html';  // 게시물 목록 페이지로 리다이렉트
}

// 게시물을 삭제하는 함수
function deleteArticle() {
    const params = new URLSearchParams(window.location.search);  // URL 쿼리 파라미터 추출
    const article_id = params.get('id');  // 'id'라는 쿼리 파라미터에서 게시물 ID 추출
    
    if (!article_id) return alert("게시물 ID가 유효하지 않습니다.");  // 게시물 ID가 없으면 경고 메시지 출력

    // 게시물 세부 정보를 서버에서 다시 가져오기 (작성자 확인 목적)
    fetch(URL + '?article_id=' + article_id, {
        method: "GET",
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(resp => resp.json())
        .then(function(data) {
            const articles = data.Items;  // 반환된 데이터는 배열로 처리
            if (!articles || articles.length === 0) {
                alert('게시글을 찾을 수 없습니다.');  // 게시물이 없을 경우 경고 메시지 출력
                return;
            }

            const article = articles.find(item => item.article_id === article_id);

            // 게시물 작성자 확인
            const currentUser = localStorage.getItem('username');

            // 작성자와 현재 사용자를 비교
            if (article && article.author === currentUser) {
                // DELETE 요청 - URL에 article_id 포함
                fetch(`${URL}?article_id=${article_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Accept': 'application/json',
                    }
                })
                .then(resp => {
                    if (resp.ok) {
                        alert('게시물이 삭제되었습니다.');  // 삭제 성공 메시지 출력
                        window.location.href = 'article_view.html';  // 삭제 후 목록 페이지로 이동
                    } else {
                        resp.json().then(data => alert('삭제 실패: ' + data.message));  // 실패 시 오류 메시지 출력
                    }
                })
                .catch(err => console.log('Error:', err));  // 오류 발생 시 콘솔에 출력
            } else {
                alert('본인의 게시물만 삭제할 수 있습니다.');  // 작성자가 아니면 삭제 불가 메시지 출력
            }
        })
        .catch(err => console.log(err));  // 오류 발생 시 콘솔에 출력
}

// 페이지네이션 부분
function updatePagination(totalArticles, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const totalPages = Math.ceil(totalArticles / articlesPerPage);

    for (let i = 1; i <= totalPages; i++) {
        let button = document.createElement('button');
        button.textContent = i;
        button.className = i === currentPage ? 'active' : '';

        button.onclick = function() {
            changePage(i);
        };

        pagination.appendChild(button);
    }
}

function changePage(page) {
    currentPage = page;
    displayArticles(article_arr, currentPage);
}

function filterArticles() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredArticles = article_arr.filter(article => 
        article.title.toLowerCase().includes(searchInput) || 
        article.content.toLowerCase().includes(searchInput)
    );
    currentPage = 1; // 검색 시 첫 페이지로 이동
    displayArticles(filteredArticles, currentPage);
}

 
AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});
 
var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: albumBucketName }
});
 
// UUID 생성 함수 추가
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// db에 정보 올리는 함수
function upload_to_db(img_location) {
    var article_id = uuidv4();  // UUID로 article_id 자동 생성
    var article_title = document.querySelector("#title").value;
    var article_content = document.querySelector("#content").value;

    var username = localStorage.getItem('username');

    var Item = {
        'article_id': article_id,
        'title': article_title,
        'content': article_content,
        'img_source': img_location,
        'timestamp': new Date().toISOString(), // 현재 시간을 ISO 포맷으로 추가
        'author': username  // 작성자 정보 추가
    };
    console.log(Item);

    const URL = "https://0wry6xpjlb.execute-api.ap-northeast-2.amazonaws.com/hama-web-api-page/article_resource";

    fetch(URL, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'  // Content-Type 명시 필요
        },
        body: JSON.stringify({
            "TableName": "hama-web-Dynamo",
            "Item": Item  // 명시적으로 Item 필드에 데이터 추가
        })
    }).then(resp => {
        if (resp.ok) {
            console.log("POST 성공");
        } else {
            resp.json().then(data => console.log("POST 실패: ", data));
        }
    })
    .catch(err => console.log('Error:', err));
}


function submitToAPI(e) {
    e.preventDefault();
    console.log("submitToAPI called"); // 콘솔에서 함수 호출 확인

    add_article_with_photo('images', function() {
        window.location.href = 'article_view.html';  // 등록 후 게시물 목록 페이지로 이동
    });
}

function cancelAndGoBack() {
    window.location.href = 'article_view.html';  // 게시물 보기 페이지로 이동
}

function add_article_with_photo(albumName, callback) {
    var files = document.getElementById("article_image").files;
    if (!files.length) {
        return alert("Please choose a file to upload first.");
    }
    var file = files[0];
    var fileName = file.name;
    var albumPhotosKey = encodeURIComponent(albumName) + "/";
 
    var photoKey = albumPhotosKey + fileName;
 
    var upload = new AWS.S3.ManagedUpload({
        params: {
            Bucket: albumBucketName,
            Key: photoKey,
            Body: file
        }
    });
 
    var promise = upload.promise();
 
    promise.then(
        function(data) {
            let img_location = data.Location;
            upload_to_db(img_location);

            alert("Successfully uploaded photo.");
            if (callback) callback();  // 콜백 함수 호출
        },
        function(err) {
            console.log(err);
            alert("There was an error uploading your photo: " + err.message);
        }
    );
}
