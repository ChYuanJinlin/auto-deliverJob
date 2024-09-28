/*
 * @Author: yuanjinlin 1075360356@qq.com
 * @Date: 2024-09-05 16:33:07
 * @LastEditors: yuanjinlin 1075360356@qq.com
 * @LastEditTime: 2024-09-12 20:36:12
 * @FilePath: \yjl-blogd:\qianduan\auto-deliver\src\utils\index.js
 * @Description:
 *
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved.
 */
export async function pageLog(content) {
  await this.evaluate((content) => {
    console.log(content);
  }, content);
}
export function request(url) {
  return new Promise(async (resolve, reject) => {
    await this.waitForResponse(async (response) => {
      if (new RegExp(url, "g").test(response.url())) {
        const res = await response.json();
        resolve({ res, url: response.url() });
      }
    });
  });
}
export function on(name, url, fn) {
  return new Promise(async (resolve, reject) => {
    await this.on(name, async (response) => {
      if (response.request().resourceType() === "xhr") {
        if (new RegExp(url, "g").test(response.url())) {
          const res = await response.json();

          fn && fn(res, response.url());
          resolve({ res, url: response.url() });
        }
      }
    });
  });
}

export function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function selector() {
  let time = null;
  timeout = selector.timeout;
  return {
    $(selector, options) {
      options.timeout = timeout || options.timeout;
      return new Promise((resolve) => {
        if (options.timeout == 0) {
          time = setInterval(() => {
            let el = document.querySelector(selector);
            if (el) {
              clearInterval(time);
              time = null;
              resolve(el);
            }
          }, 1000);
        } else {
          time = setTimeout(() => {
            let el = document.querySelector(selector);
            if (!el) {
              resolve(el);
              throw new Error("时间超时");
            }
            clearTimeout(time);
            time = null;
            resolve(el);
          }, options.timeout);
        }
      });
    },
  };
}

selector.setDefaultTimeout = function (timeout) {
  selector.timeout = timeout;
};
