document.addEventListener('DOMContentLoaded', function () {
    var saveCookieButton = document.getElementById('log-cookie-button');
    const button_info = document.querySelector('#more-BM button');
    const span_info = document.querySelector('#BM-said');
    let count = 0;
    button_info.addEventListener('mouseenter', () => {
        span_info.style.opacity = '1';
        count++;
        if (count >5) {   
            span_info.style.paddingTop = '30px';
            span_info.innerHTML='Wa đủ gòi 🥺';
        }
        if (count >10) {   
            span_info.style.paddingTop = '30px';
            span_info.innerHTML='jztr, mệc z 🙂';
        }
        if (count >20) {   
            span_info.style.paddingTop = '30px';
            span_info.style.fontSize = '30px';
            span_info.innerHTML='😏';
        }
    });
    button_info.addEventListener('mouseleave', () => {
        span_info.style.opacity = '0';
    });
  

    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async tabs => {
        let url = tabs[0].url;
        if (url.includes('https://sinhvien.ctuet.edu.vn')) {
            saveCookieButton.addEventListener('click', async function () {
                const scrollable = document.querySelector('.scrollable');
                scrollable.innerHTML = '';
                const cookies = await new Promise((resolve, reject) => {
                    chrome.cookies.getAll({ name: "ASC.AUTH", url: "https://sinhvien.ctuet.edu.vn/" }, function (cookies) {
                        if (cookies.length > 0) {
                            resolve(cookies[0].value);
                        } else {
                            add_debug('Không tìm thấy cookies, hãy đăng nhập, nếu đã đăng nhập mà vẫn hiện lỗi, liên hệ: <a href="https://t.me/rurimeiko">https://t.me/rurimeiko</a>');
                            reject(new Error('Không tìm thấy cookies, hãy đăng nhập, nếu đã đăng nhập mà vẫn hiện lỗi, liên hệ: https://t.me/rurimeiko'));
                        }
                    })
                });
                try {
                    saveCookieButton.disabled = true;
                    await sendRequests(cookies);
                    saveCookieButton.disabled = false;
                } catch (error) {
                    await add_debug(error.message);
                }
            });
        }
        else {
            var button = document.getElementById('log-cookie-button');
            button.remove();
            await add_debug('This feature only works on <a href="https://sinhvien.ctuet.edu.vn">https://sinhvien.ctuet.edu.vn</a>');
        }
    });
});

async function add_debug(text, isName = false) {
    return new Promise((resolve, reject) => {
        const table_debug = document.querySelector('.scrollable');
        const print_debug = document.createElement('p');
        print_debug.classList.add('debug-info');
        print_debug.innerHTML = text;
        if (isName) {
            print_debug.style.textAlign = 'center';
            print_debug.style.fontWeight = 'bold';
            print_debug.style.fontSize = '16px';
        } else if (text == 'This feature only works on <a href="https://sinhvien.ctuet.edu.vn">https://sinhvien.ctuet.edu.vn</a>') {
            print_debug.style.textAlign = 'center';
        };
        table_debug.appendChild(print_debug);
        table_debug.scrollTop = table_debug.scrollHeight;
        resolve();
    });
}

document.addEventListener("click", (event) => {
    if (event.target.matches("a[href^='http']")) {
      event.preventDefault();
      chrome.tabs.create({ url: event.target.href });
    }
  });
  

async function get_nummber_id_mon_hoc(cookies) {
    const url = 'https://sinhvien.ctuet.edu.vn/ket-qua-hoc-tap.html';
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'ASC.AUTH': cookies
        }
    });
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const userAccountName = doc.querySelector('.user-account-name');
    // Lấy tên
    await add_debug(userAccountName.textContent, true);
    const numbers = [];
    doc.querySelectorAll('a.btn_khaosat_danhgia').forEach(a_tag => {
        const onclick_value = a_tag.getAttribute('onclick');
        const number = onclick_value.split('(')[1].split(')')[0];
        numbers.push(number);
    });
    return numbers;
}

async function get_payload(cookies) {
    payload_list = []
    const numbers = await get_nummber_id_mon_hoc(cookies);
    await Promise.all(numbers.map(async i => {
        const payload = { 'pIDLopHocPhan': i };
        const url = 'https://sinhvien.ctuet.edu.vn/SinhVienDiem/GetKhaoSatDanhGiaXemDiem';
        try {
            const response = await fetch(url, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookies
                }
            });
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const p_element = doc.querySelector('p.bold');
            if (p_element && p_element.textContent.includes("Không tìm thấy thông tin phiếu khảo sát")) {
                console.log(`skip phiếu khảo sát ${i}`);
            } else {
                const input_element = doc.querySelector('input#GuidLHPKS');
                //4 = rất không hài lòng | 3 = tạm hài lòng | 5 = không hài lòng | 2 = hài lòng | 1 rất hài lòng
                payload_list.push(await get_id_payload(doc, input_element.value, 1, 'không có ý kiến'));
            }
        } catch (error) {
            return console.error(error);
        }

    }));
    return payload_list;
}

async function get_id_payload(doc, guid, opinion, feedback) {
    return new Promise((resolve, reject) => {
        const titleCauHoiElements = doc.querySelectorAll('.title_cauhoi, input[type="radio"], .input-ykien');
        const idArray = [];
        const idSet = {};
        if (titleCauHoiElements.length > 0) {
            for (let i = 0; i < titleCauHoiElements.length; i++) {
                const el = titleCauHoiElements[i];
                const id = el.getAttribute('id');
                if (id && !idSet[id]) {
                    idSet[id] = true;
                    idArray.push(id);
                }
            }
        }
        const idDict = {};
        for (let i = 0; i < idArray.length; i++) {
            const id = idArray[i];
            if (id.startsWith('KSLayYKien')) {
                idDict[id] = feedback;
            } else {
                idDict[id] = opinion;
            }
        }
        idDict['GuidLHPKS'] = guid;
        idDict['X-Requested-With'] = 'XMLHttpRequest';
        resolve(idDict);
    });
}


async function sendRequests(cookie) {
    const payloads = await get_payload(cookie);
    const count_Danhgia = payloads.length;
    if (count_Danhgia == 0) {
        await add_debug('Không tìm thấy đánh giá');
    }
    else {
        await add_debug(`Có ${count_Danhgia} chưa được đánh giá`);
        await add_debug('Bắt đầu đánh giá, cậu đừng bấm ra bên ngoài tiện ích');
        const url = 'https://sinhvien.ctuet.edu.vn/SinhVienDiem/PostKhaoSatXemDiem?Length=12';
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': '*/*',
                'Cookie': cookie
            }
        };
        for (const payload of payloads) {
            options.body = new URLSearchParams(payload);
            const response = await fetch(url, options);
            const result = await response.text();
            if (result == '{}') {
                await add_debug(`Đã đánh giá xong ${payload['GuidLHPKS']}`);
            }
            else { await add_debug(result) }
        }
        await add_debug('Đã đánh giá tất cả các môn, bắt đầu tải lại trang...');
        chrome.tabs.reload();
        await add_debug('Đã xong, cậu có thể tắt tiện ích lúc này');
    }
}






