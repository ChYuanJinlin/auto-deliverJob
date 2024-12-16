/*
 * @Author: yuanjinlin 1075360356@qq.com
 * @Date: 2024-09-05 16:33:07
 * @LastEditors: yuanjinlin 1075360356@qq.com
 * @LastEditTime: 2024-12-05 18:29:19
 * @FilePath: \yjl-blogd:\qianduan\auto-deliverJob\src\utils\index.js
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

// 定义一个函数来逐步处理队列中的点击事件
export async function createQueue(fn) {

  const utils = (function () {
    function createSelector(selector, options = {}) {
      let timeout = this.timeout;
      let time
      let _timeout = options;
      if (typeof options == "number") {
        options = {};
      }
      options.timeout =
        timeout ||
        (typeof _timeout == "number" ? _timeout : options.timeout) ||
        0;
      return new Promise((resolve) => {
        if (options.timeout == 0) {
          time = setInterval(() => {
            let el =
              this.name == "$"
                ? document.querySelector(selector)
                : document.querySelectorAll(selector);
            if (el) {
              clearInterval(time);
              time = null;
              resolve(el);
            }
          }, 1000);
        } else {
          time = setTimeout(() => {
            let el =
              this.name == "$"
                ? document.querySelector(selector)
                : document.querySelectorAll(selector);
            clearTimeout(time);
            time = null;
            resolve(el);
          }, options.timeout);
        }
      });
    }
    function selector() {
      return {
        async $() {
          return await createSelector.call(this.$, ...arguments);
        },
        async $$() {
          return await createSelector.call(this.$$, ...arguments);
        },
      };
    }

    selector.setDefaultTimeout = function (timeout = 0) {
      selector.timeout = timeout;
    };
    selector.setDefaultTimeout();
    return {
      selector,
    };
  })();
  if (!createQueue.queues) {
    createQueue.queues = [];
  }
  const content = await utils
    .selector()
    .$(
      "#container > div > div > div.list-warp > div > div.chat-content > div > div"
    );
  function start(scroll = true) {
    async function delItem(item, loop = false, fn) {
      // 删除不匹配的岗位
      let element = item.firstChild.children[1]?.children[2];
      element = element?.children[2]
        ? element?.children[2]
        : element?.children[1];
      // 触发 mouseenter 事件
      var event = new MouseEvent("mouseenter", {
        view: window,
        bubbles: true, // mouseenter 不冒泡，但这个参数在这里是无关紧要的
        cancelable: true,
      });

      element?.dispatchEvent(event);

      // 点击删除
      (
        await utils
          .selector()
          .$(".operation-container .operation-item:nth-child(2)")
      )?.click();

      // 确定删除
      (
        await utils
          .selector()
          .$(
            ".boss-popup__wrapper.boss-dialog.boss-dialog__wrapper.dialog-default.primitive.dialog-icon__default > div.boss-popup__content > div.boss-dialog__footer > span:nth-child(2)"
          )
      )?.click();

      console.log("已删除职位", positionName);
      if (loop) {
        setTimeout(() => {
          isProcessingQueue = false; // 标记为处理完毕
          index++;
          requestAnimationFrame(processNextItem); // 在下一个动画帧中继续处理
        }, 1000);
      }
    }
    if (createQueue.queues.length === 0 || createQueue.isProcessingQueue) {
      return; // 如果没有队列项或正在处理，则直接返回
    }

    createQueue.isProcessingQueue = true; // 标记为正在处理队列
    (async function processNextItem() {
      // 有没有没有更多了
      // let noMoreEl = await utils
      //   .selector()
      //   .$(
      //     "#container > div > div > div.list-warp > div > div.chat-content > div > div > div:nth-child(3) > div > div"
      //   );

      // 关闭弹窗
      document
        .querySelector(
          ".boss-popup__wrapper.boss-dialog.boss-dialog__wrapper.dialog-default.primitive.dialog-icon__default > div.boss-popup__close"
        )
        ?.click();
      // console.log("createQueue.queues---", createQueue.queues);
      console.log("createQueue.queues", createQueue.queues);

      if (scroll && !createQueue.queues.length) {
        if (value != get().paddingTop) {
          content.scrollTo(0, content.scrollTop + 500);
          value = get().padTopVal;
          observe.disconnect();
          get().runObserver();
          return;
        }
      }
      let item = createQueue.queues.shift(); // 从队列中移除并获取第一个元素

      if (item) {
        item.firstChild.click(); // 触发点击事件

        if (isDelItem) {
          delItem(item, true, processNextItem);
          return;
        }

        const cityText = (
          await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.top-info > div.chat-position-content > div.main > a > span.city"
            )
        )?.textContent;
        // 当前职位名称
        positionName = (
          await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.top-info > div.chat-position-content > div.main > a > span.position-name"
            )
        )?.textContent;
        console.log("当前职位", positionName);
        await new Promise(async (resolve, reject) => {
          // 精确匹配 匹配地区和职位

          if (jobNames?.length && citys?.length && positionName) {
            if (
              new RegExp(jobNames, "gi").test(positionName) &&
              new RegExp(citys, "gi").test(cityText)
            ) {
              await sendResume();
            } else if (
              !new RegExp(jobNames, "gi").test(positionName) &&
              positionName
            ) {
              delItem(item);
            }
          } else {
            // 投递简历
            await sendResume();
          }

          resolve();
        });

        // 设置定时器，一秒后继续处理下一个队列项
        setTimeout(() => {
          createQueue.isProcessingQueue = false; // 标记为处理完毕
          index++;
          requestAnimationFrame(processNextItem); // 在下一个动画帧中继续处理
        }, 0);
      }
    })(); // 立即执行函数表达式，开始处理队列
  }
  createQueue.start = start;

  fn.call(createQueue);
}
