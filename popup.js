document.addEventListener('DOMContentLoaded', function() {
var saveCookieButton = document.getElementById('log-cookie-button');
chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
    let url = tabs[0].url;
if (url.includes('https://sinhvien.ctuet.edu.vn')) {
    saveCookieButton.addEventListener('click', function () 
    {
        chrome.cookies.getAll({name: "ASC.AUTH",url: "https://sinhvien.ctuet.edu.vn/"}, function(cookies) 
        {
            if (cookies.length > 0) {
                console.log(cookies[0].value)
                document.getElementById('debug-info').innerHTML = cookies[0].value;
            } else {
                alert('There are no cookies for this site!');
            }
        })
    }
    );
}
else {
    var button = document.getElementById('log-cookie-button');
    button.remove();
    document.getElementById('debug-info').innerHTML = "This feature only works on https://sinhvien.ctuet.edu.vn";}
});
});
    