// 测试结果送到哪里。做法见 README.md 的「设定 Google 表单」。
// 留空也可以用：结果会保存在手机上，测完按「复制结果」发给组长。
window.TC_CONFIG = {
  // 把表单网址最后的 /viewform 换成 /formResponse，例如：
  // 'https://docs.google.com/forms/d/e/1FAIpQLSxxxxxxxx/formResponse'
  formAction: '',

  // 每一题对应的 entry 编号，例如 'entry.123456789'
  fields: {
    participant: '', // 参与者编号
    role: '',        // 角色
    summary: '',     // 摘要
    answers: '',     // 问卷答案
    events: ''       // 详细记录
  }
};
