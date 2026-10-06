const { matterMarkdownAdapter } = require('@elog/cli')

/**
 * 语雀正文里的 {{ }} / {% %} 会被 Hexo 的 Nunjucks 当成模板标签解析，
 * 导致 hexo generate 直接报错（本博客大量 SSTI、模板注入类文章会命中）。
 * 用单次正则把每个标记单独包进 {% raw %}，replace 的回调结果不会被再次扫描，
 * 因此不存在旧实现那样的级联替换问题。
 */
const escapeNunjucksTags = (body) =>
  body.replace(/\{\{|\}\}|\{%|%\}/g, (tag) => `{% raw %}${tag}{% endraw %}`)

/**
 * 自定义文档插件
 * @param {DocDetail} doc doc的类型定义为 DocDetail
 * @return {Promise<DocDetail>} 返回处理后的文档对象
 */
const format = async (doc) => {
  if (doc.body) {
    // 已经手工写了 raw 块的文档不再处理，避免嵌套
    if (!doc.body.includes('{% raw %}')) {
      doc.body = escapeNunjucksTags(doc.body)
    }
    // 首页只展示标题，正文全部折叠到 "阅读全文" 之后
    doc.body = '<!--more--> \n' + doc.body
  }
  doc.body = matterMarkdownAdapter(doc)
  return doc
}

module.exports = {
  format,
}
