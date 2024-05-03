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
    // 获取第一行数据
    // let f_v = doc.body.indexOf("\n")
    // doc.body = doc.body.substring(0, f_v) + '<!--more-->' + doc.body.substring(f_v+1)
    doc.body = "<!--more--> \n" + doc.body
  }
  doc.body = matterMarkdownAdapter(doc);
  return doc;
};

module.exports = {
  format,
};
