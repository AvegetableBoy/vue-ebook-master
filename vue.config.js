function mock(app, url, data) {
  app.get(url, (request, response) => {
    response.json(data)
  })
}

const homeData = require('./src/mock/bookHome')
const shelfData = require('./src/mock/bookShelf')
const listData = require('./src/mock/bookList')
const flatListData = require('./src/mock/bookFlatList')

module.exports = {


  lintOnSave: false,
  publicPath: process.env.NODE_ENV === 'production'
    ? './'
    : '/',

  devServer: {
    public: 'http://172.25.29.205:8081',
    before(app) {
      mock(app, '/book/home', homeData)
      mock(app, '/book/shelf', shelfData)
      mock(app, '/book/list', listData)
      mock(app, '/book/flat-list', flatListData)
    }


  },

  configureWebpack: {
    performance: {
      hints: 'warning',
      maxAssetSize: 524288 * 10,
      maxEntrypointSize: 524288 * 10
    }
  }

}
// module.exports = {
//    configureWebpack:{
//        resolve:{
//            alias:{
//                'assets':'@/assets',
//                'components':'@/components',
//                'views':'@/views'
//            }
//        }
//    }
// }
