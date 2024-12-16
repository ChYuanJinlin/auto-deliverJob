/*
 * @Author: yuanjinlin 1075360356@qq.com
 * @Date: 2024-09-04 10:48:20
 * @LastEditors: yuanjinlin 1075360356@qq.com
 * @LastEditTime: 2024-12-07 14:36:22
 * @FilePath: \yjl-blogd:\qianduan\auto-deliverJob\src\main.js
 * @Description:
 *
 * Copyright (c) 2024 by ${git_name_email}, All Rights Reserved.
 */
import puppeteer from "puppeteer";
import axios from "axios";
import inquirer from "inquirer";
import { request, sleep, on, pageLog } from "./utils/index.js";
const config = {
  // 匹配的职位的关键词
  jobNames: [
    "前端",
    "小程序",
    "react",
    "vue",
    "uni-app",
    "移动端",
    "web端",
    "nodejs",
    "Javascript",
    "web前端",
    "web",
    "h5",
    "前端开发工程师",
    // "ui设计师",
  ],
  citys: ["成都"],
  // 地区
  district: ["武侯区"],
  // 薪资过滤如果不传默认不限制 格式如13-20
  salary: "",
  // 是否只需要删除列表项,不做其他处理
  isDelItem: true,
  open: 2, // 1->去沟通 2-> 去投递 3-> 监听消息
  // 需要过滤职位包含的关键词
  filterJob: [],
  // 发消息的内容
  content:
    " 你好，我是一个拥有五年经验前端开发者，包括开发过pc页面，小程序，混合app，h5可视化大屏，以及桌面端的开发经验，可以直接上手项目，希望公司可以给一个机会，让我加入公司并肩作战，谢谢",
  // // 选择第几个tab
  // content:
  //   "您好，我是拥有5年互联网产品UI设计经验,积累了丰富的项目实战成果。擅长运用多种设计工具，包括Figma、Axure、墨刀原型设计，Xmind，Illustrator、Photoshop、Sketch、After Effects,并且熟悉HTML、CSS及前端布局，期待有机会加入贵公司，共同打造卓越产品。谢谢！",
  // 选中boss 的tab标签栏
  tabs: 2,
};
class Boss {
  #types = {
    BOSS: "https://www.zhipin.com/web/geek/job-recommend?ka=header-job-recommend",
  };
  #cookies = [];
  // 沟通次数
  count = 1;
  constructor(options = {}) {
    this.options = options;
    this.index = 0;
    this.chatIndex = 0;
    config.jobNames = config.jobNames.join("|");
    config.citys = config.citys.join("|");
  }

  async #init() {
    try {
      // todo   如需要连接本地浏览器请看文件example.png 示例 加上这段 --remote-debugging-port=9222
      let wsKey = await axios.get("http://localhost:9222/json/version");
      this.browser = await puppeteer.connect({
        headless: false,
        browserWSEndpoint: wsKey.data.webSocketDebuggerUrl,
        timeout: 0, // 如果需要的话，设置启动超时时间
        protocolTimeout: 0, // 设置协议超时时间为 30 秒
        defaultViewport: null,
        executablePath: "C:/Program Files/Google/Chrome/Application",
        ignoreDefaultArgs: ["--disable-extensions"],
        args: ["--start-maximized"],
        ignoreDefaultArgs: ["--enable-automation"],
        dumpio: true,
        devtools: true,
        slowMo: 50,
      });
      // this.browserContext = await browser.createIncognitoBrowserContext();

      this.page = await this.browser.newPage();

      this.page.setDefaultTimeout(0);
      // this.page.setRequestInterception(true);
      // this.page.setDefaultNavigationTimeout(0);
      // if (this.#cookies.length) {
      //   await this.page.setCookie(...this.#cookies);
      //   console.log("cookies--", this.#cookies);
      // }
      Promise.resolve();
    } catch (error) {
      if (/connect ECONNREFUSED/g.test(error.message)) {
        console.log("请启动浏览器");
        process.exit();
      }

      Promise.reject(error);
      console.log(error);
    }
  }
  async run() {
    await this.#init();
    Promise.resolve();
    return this;
  }
  // 监听对方发过来的消息
  async watchInfos() {
    console.log("监听消息中...");

    this.page4 = await this.browser.newPage();
    await this.page4.goto("https://www.zhipin.com/web/geek/chat");

    await this.page4.evaluate(
      async ({ jobNames, page, textContent, citys, isDelItem }) => {
        console.log("监听消息中...");
        let value,
          observe,
          positionName,
          index = 0;
        const utils = (function () {
          function createSelector(selector, options = {}) {
            let timeout = this.timeout;
            let _timeout = options;
            if (typeof options == "number") {
              options = {};
            }
            options.timeout =
              timeout ||
              (typeof _timeout == "number" ? _timeout : options.timeout) ||
              0;
            const promise = new Promise((resolve) => {
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
            promise.catch((err) => {
              console.log("🚀 ~ Boss ~ createSelector ~ err:", err);
            });
            return promise;
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
        document
          .querySelectorAll(
            "#container > div > div > div.list-warp > div > div.chat-content > div > div > ul:nth-child(2) > li > div > div.text > div.gray.last-msg > div"
          )
          .forEach((item) => (item.style.display = "block"));
        // 发送简历
        async function sendResume() {
          // 对方内容发过来
          const friendResumeText = (
            await utils
              .selector()
              .$(
                ".message-item-content > div.message-dialog.boss-green > div.dialog-content > div > p",
                500
              )
          )?.textContent;
          // 当前是否已经发过简历
          const myselfResumeText = (
            await utils
              .selector()
              .$(
                ".message-card-top-wrap > div.message-card-top-content > .message-card-top-text",
                500
              )
          )?.textContent;
          // 发过来的消息
          const itemFriend = await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.message-content > div.chat-record > div.chat-message > ul > .item-friend",
              500
            );
          // 已回复的消息
          const itemMyself = await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.message-content > div.chat-record > div.chat-message > ul > .item-myself",
              500
            );
          // 如果对方消息存在
          if (itemFriend) {
            // 在判断如果没有投过简历 并且没有发过消息
            if (
              (friendResumeText && !myselfResumeText) ||
              (!friendResumeText && !myselfResumeText)
            ) {
              // 如果我没有发送过消息,就去发消息然后投简历
              if (!itemMyself) {
                // 如果对方已经发消息过来，要回复他消息
                const input = await utils.selector().$("#chat-input");
                input.textContent = textContent;
                // 触发 input 事件
                const inputEvent = new Event("input", {
                  bubbles: true,
                });
                input.dispatchEvent(inputEvent);
                (
                  await utils
                    .selector()
                    .$(
                      "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-op > button"
                    )
                ).click();
              }
              // 点击简历
              (
                await utils
                  .selector()
                  .$(
                    "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top"
                  )
              ).click();

              const panelResume = await utils
                .selector()
                .$(
                  "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top > div"
                );
              // 如果简历只一个存在的话,直接点击发送
              // console.log("panelResume---", panelResume);

              if (panelResume && panelResume?.style?.display == "block") {
                (
                  await utils
                    .selector()
                    .$(
                      "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top > div > div > div.btns > span.btn-v2.btn-sure-v2"
                    )
                ).click();
              } else {
                // 如果有多个简历，选择简历
                // 选择简历
                (
                  await utils
                    .selector()
                    .$(".boss-popup__wrapper .list-item:nth-child(1)")
                ).click();
                // 点击发送
                (
                  await utils.selector().$(".boss-popup__wrapper button")
                ).click();
              }
              Promise.resolve();
            }
          }
        }

        // 定义一个函数来逐步处理队列中的点击事件
        async function createQueue(fn) {
          if (!createQueue.queues) {
            createQueue.queues = [];
          }
          if (!createQueue.addedElements) {
            createQueue.addedElements = new Set(); // 存储已经添加过的元素
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

            (async function processNextItem() {
              if (
                createQueue.queues.length === 0 ||
                createQueue.isProcessingQueue
              ) {
                return; // 如果没有队列项或正在处理，则直接返回
              }
              createQueue.isProcessingQueue = true; // 标记为正在处理队列
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
              console.log("正在处理", createQueue.queues);

              let item = createQueue.queues.shift(); // 从队列中移除并获取第一个元素

              if (item) {
                item.firstChild.click(); // 触发点击事件

                if (isDelItem) {
                  delItem(item, true, processNextItem);
                  return;
                }
                try {
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
                    console.log("处理完毕");
                    console.dir(createQueue);
                    if (!createQueue.length) {
                      createQueue.count = 0;
                    }
                    index++;
                    requestAnimationFrame(processNextItem); // 在下一个动画帧中继续处理
                  }, 0);
                } catch (error) {
                  console.log("🚀 ~ Boss ~ processNextItem ~ error:", error);
                }
              }
            })(); // 立即执行函数表达式，开始处理队列
          }
          createQueue.start = start;

          fn.call(createQueue);
        }

        function runObserver() {
          createQueue(function () {
            // 观察所有的li元素
            const list = document.querySelector(
              "#container > div > div > div.list-warp > div > div.chat-content > div > div > ul:nth-child(2)"
            );

            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                  console.log("mutation.addedNodes", mutation.addedNodes);
                  mutation.addedNodes.forEach((node) => {
                    if (!this.queues.includes(node)) {
                      if (!this.count) {
                        this.count = 0;
                      }
                      // 当元素进入视口且不在队列中时，将其添加到队列中createQueue
                      if (!createQueue.addedElements.has(node)) {
                        createQueue.addedElements.add(node);
                        this.queues.unshift(node);
                      }

                      this.count++;
                      console.log("当前个数", this.count);
                      console.log(`新节点被添加`, node);
                      console.dir(node);
                      console.dir(this);
                      // 如果当前没有正在处理的队列项，则开始处理
                      if (!this.isProcessingQueue) {
                        this.start();
                      }
                    }
                  });
                }
              });
            });
            observer.observe(list, { childList: true });
          });
        }
        runObserver();
      },
      {
        jobNames: config.jobNames,
        sleep,
        page: this.page3,
        textContent: config.content,
        citys: config.citys,
        isDelItem: config.isDelItem,
      }
    );
  }

  // 投递简历
  async deliverResume() {
    console.log("投递简历中...");
    // if (!this.chatData) {

    //   on.call(
    //     this.page3,
    //     "response",
    //     "friend/getGeekFriendList.json",
    //     (res) => {
    //       if (!this.chatData) {
    //         this.chatData = res.zpData.result;
    //       } else {
    //         this.chatData = [...this.chatData, ...res.zpData.result];
    //       }
    //       pageLog.call(this.page3, this.chatData);
    //     }
    //   );
    // }

    this.page3 = await this.browser.newPage();
    await this.page3.goto("https://www.zhipin.com/web/geek/chat");

    // 在页面上设置一个IntersectionObserver
    await this.page3.evaluate(
      async ({ jobNames, page, textContent, citys, isDelItem }) => {
        let value,
          observe,
          positionName,
          index = 0;
        const utils = (function () {
          function createSelector(selector, options = {}) {
            let timeout = this.timeout;
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
        document
          .querySelectorAll(
            "#container > div > div > div.list-warp > div > div.chat-content > div > div > ul:nth-child(2) > li > div > div.text > div.gray.last-msg > div"
          )
          .forEach((item) => (item.style.display = "block"));
        // 发送简历
        async function sendResume() {
          // 对方内容发过来
          const friendResumeText = (
            await utils
              .selector()
              .$(
                ".message-item-content > div.message-dialog.boss-green > div.dialog-content > div > p",
                500
              )
          )?.textContent;
          // 当前是否已经发过简历
          const myselfResumeText = (
            await utils
              .selector()
              .$(
                ".message-card-top-wrap > div.message-card-top-content > .message-card-top-text",
                500
              )
          )?.textContent;
          // 发过来的消息
          const itemFriend = await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.message-content > div.chat-record > div.chat-message > ul > .item-friend",
              500
            );
          // 已回复的消息
          const itemMyself = await utils
            .selector()
            .$(
              "#container > div > div > div.chat-conversation > div.message-content > div.chat-record > div.chat-message > ul > .item-myself",
              500
            );
          // 如果对方消息存在
          if (itemFriend) {
            // 在判断如果没有投过简历 并且没有发过消息
            if (
              (friendResumeText && !myselfResumeText) ||
              (!friendResumeText && !myselfResumeText)
            ) {
              // 如果我没有发送过消息,就去发消息然后投简历
              if (!itemMyself) {
                // 如果对方已经发消息过来，要回复他消息
                const input = await utils.selector().$("#chat-input");
                input.textContent = textContent;
                // 触发 input 事件
                const inputEvent = new Event("input", {
                  bubbles: true,
                });
                input.dispatchEvent(inputEvent);
                (
                  await utils
                    .selector()
                    .$(
                      "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-op > button"
                    )
                ).click();
              }
              // 点击简历
              (
                await utils
                  .selector()
                  .$(
                    "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top"
                  )
              ).click();

              const panelResume = await utils
                .selector()
                .$(
                  "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top > div"
                );
              // 如果简历只一个存在的话,直接点击发送
              // console.log("panelResume---", panelResume);

              if (panelResume && panelResume?.style?.display == "block") {
                (
                  await utils
                    .selector()
                    .$(
                      "#container > div > div > div.chat-conversation > div.message-controls > div > div.chat-controls > div.btn-resume.toolbar-btn.tooltip.tooltip-top > div > div > div.btns > span.btn-v2.btn-sure-v2"
                    )
                ).click();
              } else {
                // 如果有多个简历，选择简历
                // 选择简历
                (
                  await utils
                    .selector()
                    .$(".boss-popup__wrapper .list-item:nth-child(1)")
                ).click();
                // 点击发送
                (
                  await utils.selector().$(".boss-popup__wrapper button")
                ).click();
              }
              Promise.resolve();
            }
          }
        }

        const get = () => {
          const padTopVal = parseInt(
            document.querySelector(
              "#container > div > div > div.list-warp > div > div.chat-content > div > div > ul:nth-child(2)"
            )?.style?.paddingTop
          );
          return {
            padTopVal,
            runObserver() {
              createQueue(function () {
                // 观察所有的li元素
                const lis = document.querySelectorAll(
                  "#container > div > div > div.list-warp > div > div.chat-content > div > div > ul:nth-child(2) > li"
                );

                // 创建 IntersectionObserver 实例
                observe = new IntersectionObserver((entries, observer) => {
                  entries.forEach((entry) => {
                    if (
                      entry.isIntersecting &&
                      !this.queues.includes(entry.target)
                    ) {
                      if (!this.count) {
                        this.count = 0;
                      }
                      // 当元素进入视口且不在队列中时，将其添加到队列中createQueue
                      this.queues.push(entry.target);
                      this.count++;
                      console.log("当前个数", this.count);
                      console.log(`新节点被添加`, entry.target);
                      console.dir(entry.target);
                      console.dir(this);
                      // 如果当前没有正在处理的队列项，则开始处理
                      if (!this.isProcessingQueue) {
                        this.start();
                      }
                    }
                  });
                });
                lis.forEach((item) => {
                  observe.observe(item);
                });
              });
            },
          };
        };
        // 定义一个函数来逐步处理队列中的点击事件
        async function createQueue(fn) {
          if (!createQueue.queues) {
            createQueue.queues = [];
          }
          const content = await utils
            .selector()
            .$(
              "#container > div > div > div.list-warp > div > div.chat-content > div > div"
            );

          function start(scroll = true) {
            async function processNextItem() {
              createQueue.isProcessingQueue = true; // 标记为正在处理队列
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

              if (scroll && !createQueue.queues.length) {
                if (value != get().paddingTop) {
                  content.scrollTo(0, content.scrollTop + 500);
                  value = get().padTopVal;
                  createQueue.isProcessingQueue = false;
                  createQueue.count = 0;
                  observe.disconnect();
                  get().runObserver();
                  return;
                }
              }
              let item = createQueue.queues.shift(); // 从队列中移除并获取第一个元素
              console.log("createQueue.queues", createQueue.queues);

              if (item) {
                item.firstChild.click(); // 触发点击事件
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
                if (isDelItem) {
                  delItem(item, true, processNextItem);
                  return;
                }

                console.log("当前职位", positionName);
                await new Promise(async (resolve, reject) => {
                  // 精确匹配 匹配地区和职位
                  try {
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
                  } catch (error) {
                    console.log("🚀 ~ Boss ~ awaitnewPromise ~ error:", error);
                  }
                });
                handle();
              }
            } // 立即执行函数表达式，开始处理队列
            processNextItem();
            function handle() {
              // 设置定时器，一秒后继续处理下一个队列项
              setTimeout(() => {
                createQueue.isProcessingQueue = false; // 标记为处理完毕
                console.log("处理完毕");
                console.dir(createQueue);
                index++;
                requestAnimationFrame(processNextItem); // 在下一个动画帧中继续处理
              }, 0);
            }

            async function delItem(item, loop = false, callBack) {
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
              handle();
              return;
            }
          }
          createQueue.start = start;

          fn.call(createQueue);
        }

        async function sendObserver() {
          // let jobNames = "前端";
          // let citys = "成都";
          // 删除所有的消息列表

          value = get().padTopVal;
          get().runObserver();
        }
        window.sendObserver = sendObserver;
        try {
          sendObserver();
        } catch (error) {
          console.log("error", error);
        }
      },
      {
        jobNames: config.jobNames,
        sleep,
        page: this.page3,
        textContent: config.content,
        citys: config.citys,
        isDelItem: config.isDelItem,
      }
    );
  }
  // todo 抽离
  async login() {
    try {
      const { type } = await inquirer.prompt([
        {
          type: "list",
          message: "请选择需要投递的招聘网站",
          name: "type",
          choices: ["BOSS", "智联"],
        },
      ]);

      await this.page.goto(this.#types[type]);

      await this.page.evaluate(() => {
        // 监听 beforeunload 事件
        window.addEventListener("beforeunload", function (event) {
          // 设置提示信息，让用户确认是否离开页面
          event.returnValue = "你确定要离开这个页面吗？";
        });

        // 监听 unload 事件，阻止跳转
        window.addEventListener("unload", function (event) {
          // 取消页面跳转
          event.preventDefault();
        });
      });
      // 点击登录
      await this.page.click(
        "#header > div.inner.home-inner > div.user-nav > div > a.btn.btn-outline.header-login-btn"
      );
      // 点击微信登录
      (
        await this.page.waitForSelector(
          "#wrap > div > div.login-register-unite > div.login-register-content > div.login-phone-wrapper > div.sms-form-wrapper > div.wx-login-area > a",
          {
            timeout: 0,
          }
        )
      ).click();
    } catch (error) {}
    Promise.resolve();
    return this;
  }
  async selectTab() {
    await this.page.waitForSelector(
      "#wrap > div.job-recommend-main > div.job-recommend-result",
      {
        timeout: 0,
      }
    );
    // if (!this.#cookies.length) {
    //   const c = await this.page.cookies();
    //   this.#cookies = c.map((item) => ({ name: item.name, value: item.value }));
    //   await this.page.setCookie(...this.#cookies);
    //   console.log("获取 cookies", this.#cookies);
    // }
    // 选中第二个table
    await this.page.click(
      `.recommend-search-expect  > .recommend-job-btn:nth-child(${
        config.tabs + 1
      })`
    );

    // 获取点击的详情
    request.call(this.page, "job/detail.json").then(({ res }) => {
      this.infosPar = res.zpData.jobInfo;
    });
    // 获取列表数据

    const { res, url } = await request.call(this.page, "job/list.json");
    this.data = res.zpData.jobList;
    Promise.resolve();
  }
  // 去沟通
  async toInteract(data = this.infosPar) {
    this.page.on("dialog", async (dialog) => {
      // 关闭弹窗
      try {
        await dialog.dismiss();
      } catch (error) {}
    });
    // this.index++;
    // return this.sendInfos();
    const { encryptUserId, encryptId, jobNames, address, salaryDesc } = data;
    // 如果地区不匹配不去沟通
    if (
      (!config.district || new RegExp(config.district, "g").test(address)) &&
      this.isSalary(salaryDesc)
    ) {
      const btn =
        "#wrap > div.job-recommend-main > div.job-recommend-result > div > div > div.job-detail-container > div > div.job-detail-header > div.job-detail-op.clearfix > a.op-btn.op-btn-chat";
      this.page.waitForSelector(btn);
      const text = await this.page.$eval(btn, (el) => el.textContent);
      if (text !== "立即沟通") {
        this.index += 1;
        return this.sendInfos();
      }

      await this.page.click(btn);
      await request.call(this.page, "friend/add.json").then(async ({ res }) => {
        // console.log("🚀 ~ Boss ~ awaitrequest.call ~ res:", res);

        if (res.code == 1) {
          console.log(`今日沟通人数${this.count}已达上限，请明天再试`);
          this.deliverResume();
          return;
        }
        await sleep(500);
        await this.page.evaluate(() => {
          const close = document.querySelector(
            "body > div.greet-boss-dialog > div.greet-boss-container > div.greet-boss-header > span > i"
          );
          console.log("close", close);

          if (close) {
            close.click();
          }
        });
        // 监听弹窗

        this.page2 = await this.browser.newPage();
        // 立即沟通
        const url = `https://www.zhipin.com/web/geek/chat?id=${encryptUserId}&jobId=${encryptId}&securityId=${this.infosPar.securityId}&lid=${this.infosPar.lid}`;
        await this.page2.goto(url);
        this.count += 1;
        this.index++;
        await this.page2.waitForSelector("#chat-input"), { timeout: 0 };
        await this.page2.type("#chat-input", "你好");
        await this.page2.evaluate((content) => {
          const element = document.querySelector("#chat-input");
          element.textContent = content;
        }, config.content);
        await this.page2.keyboard.press("Enter");
        this.page2.close();
        return this.sendInfos();
      });
    } else {
      this.index++;
      this.sendInfos();
    }
  }
  isSalary(salary) {
    salary = salary.split("-");
    if (!config.salary) {
      return true;
    }
    const [min, max] = config.salary.split("-");
    return (
      config.salary &&
      parseInt(salary[0]) > parseInt(min) &&
      parseInt(salary[1]) < parseInt(max)
    );
  }
  // 选择列表
  async clickList(options) {
    return new Promise(async (resolve) => {
      const { selector, field, url: _url } = options;
      await this[field.page].waitForSelector(selector.ul, {
        timeout: 0,
      });
      // 判断当前职位是否是前端
      if (_url) {
        while (true) {
          // console.log("this.#index1", this[field.index]);
          if (!config.jobNames || !config.jobNames.length) break;
          // 判断当前数据如果没有证明要加载分页
          if (!this[field.data][this[field.index]]) {
            await this[field.page].evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });

            const { res, url } = await on.call(
              this[field.page],
              "response",
              _url
            );
            if (this.url == url) {
              continue;
            }
            this[field.data] = [...this[field.data], ...res.zpData[field.res]];
            continue;
          }
          if (
            new RegExp(config.jobNames, "gi").test(
              this[field.data][this[field.index]].jobName
            )
          ) {
            console.log(
              "jobNames--",
              this[field.data][this[field.index]].jobName
            );
            break;
          } else {
            this[field.index]++;
          }
        }
      }

      if (!this[field.data][this[field.index]]) {
        await this[field.page].evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
      }
      if (_url) {
        request.call(this[field.page], _url).then(async ({ res, url }) => {
          if (this.url !== url) {
            this.url = url;
            this[field.data] = [...this[field.data], ...res.zpData[field.res]];
            console.log(" this.data", this[field.data].length);
          }
        });
      }

      this[field.items] = await this[field.page].$$(selector.li);
      console.log("this[field.index]", this[field.index]);

      console.log("items--", this[field.items].length);
      await this[field.page].click(
        `${selector.li}:nth-child(${this[field.index] + 1})`
      );
      console.log("点击了");
      resolve();
    });
  }
  // 去沟通
  async sendInfos() {
    if (!this.isSelectTab) {
      await this.selectTab();
      this.isSelectTab = true;
    }

    try {
      console.log("开始选择职位发送消息");
      await this.clickList({
        selector: {
          ul: "#wrap > div.job-recommend-main > div.job-recommend-result > div > div > div.job-list-container > ul",
          li: "#wrap > div.job-recommend-main > div.job-recommend-result > div > div > div.job-list-container > ul > .job-card-wrap",
        },
        field: {
          page: "page",
          index: "index",
          res: "jobList",
          data: "data",
        },
        url: "job/list.json",
      });
      console.log("index--", this.index);
      if (this.index == 0) {
        return this.toInteract();
      }
      // 监听点击的详情
      request.call(this.page, "job/detail.json").then(async ({ res }) => {
        this.toInteract(res.zpData.jobInfo);
      });
    } catch (error) {
      console.log("error", error);
    }
  }
}

const page = new Boss();
await page.run();
if (config.open == 2) {
  // 去投递简历
  await page.deliverResume();
} else if (config.open == 1) {
  await page.login();
  // 去沟通
  await page.sendInfos();
} else {
  await page.watchInfos();
}
