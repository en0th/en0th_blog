const { matterMarkdownAdapter } = require('@elog/cli')
/**
 * 自定义文档插件
 * @param {DocDetail} doc doc的类型定义为 DocDetail
 * @return {Promise<DocDetail>} 返回处理后的文档对象
 */
const format = async (doc) => {
  if (doc.body) {
    doc.body = doc.body.replaceAll('{{', '{% raw %}{{')
    doc.body = doc.body.replaceAll('}}', '}}{% endraw %}')
  }
  doc.body = matterMarkdownAdapter(doc);
  return doc;
};

module.exports = {
  format,
};
