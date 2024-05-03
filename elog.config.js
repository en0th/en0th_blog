module.exports = {
  write: {
    platform: 'yuque-pwd',
    "yuque-pwd": {
      username: process.env.YUQUE_USERNAME,
      password: process.env.YUQUE_PASSWORD,
      host: '',
      login: process.env.YUQUE_LOGIN,
      repo: process.env.YUQUE_REPO,
      linebreak: false
    }
  },
  deploy: {
    platform: "local",
    local: {
      outputDir: "./source/_posts/",
      filename: "title",
      format: "matter-markdown",
      catalog: true,
      frontMatter: {
        enable: true,
        exclude: ['urlname','description','cover'] // 文档属性排除 description,urlname 字段
      },
      formatExt: './elog.format.js',
    }
  },
  image: {
    enable: true,
    platform: 'local',
    local: {
      outputDir: './source/images/posts',
      pathFollowDoc: true,
    }
  }
}