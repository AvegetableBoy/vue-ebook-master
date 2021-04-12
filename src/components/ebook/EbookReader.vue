<template>
  <div class="ebook-reader">

    <div id="read"></div>
    <div class="ebook-reader-mask"
         @click=" onMaskClick"
         @touchmove="move"
         @touchend="moveEnd"
         @mousedown.left="  onMouseEnter"
         @mousemove.left="onMouseMove"
         @mouseup.left="onMouseEnd"
    ></div>
  </div>
</template>
<script>

import {ebookMixin} from '../../utils/mixin'
import Epub from 'epubjs'
import {
  getFontFamily,
  getFontSize,
  getLocation,
  getTheme,
  saveFontFamily,
  saveFontSize,
  saveTheme
} from "../../utils/localStorage";
import {flatten} from "../../utils/book";
import {getLocalForage} from "../../utils/localForage";

global.ePub = Epub
export default {
  mixins: [ebookMixin],
  methods: {
    //1-鼠标进入
    //2-鼠标进入后移动
    //3-鼠标从移动状态松手
    //4-鼠标还原

    onMouseEnd(e) {
      if (this.mouseState === 2) {
        this.setOffsetY(0)
        this.firstOffsetY = null
        this.mouseState = 3
      } else {
        //就是普通点击状态
        this.mouseState = 4
      }

      const time = e.timeStamp - this.mouseStateTime
      if (time < 100) {
        this.mouseState = 4
      }
      e.preventDefault()
      e.stopPropagation()

    },
    onMouseMove(e) {
      if (this.mouseState === 1) {
        this.mouseState = 2
      } else if (this.mouseState === 2) {
        let offsetY = 0
        if (this.firstOffsetY) {
          offsetY = e.clientY - this.firstOffsetY
          this.setOffsetY(offsetY)
        } else {
          this.firstOffsetY = e.clientY

        }

      }
      e.preventDefault()
      e.stopPropagation()

    },
    onMouseEnter(e) {
      this.mouseState = 1
      this.mouseStateTime = e.timeStamp
      e.preventDefault()
      e.stopPropagation()

    },

    restore() {
      this.$refs.ebook.style.top = 0
      this.$refs.ebook.style.transition = 'all .2s linear'
      setTimeout(() => {
        this.$refs.ebook.style.transition = ''
      }, 200)
    }
    ,
    move(e) {
      let offsetY = 0
      if (this.firstOffsetY) {
        offsetY = e.changedTouches[0].clientY - this.firstOffsetY
        this.setOffsetY(offsetY)
      } else {
        this.firstOffsetY = e.changedTouches[0].clientY

      }


      e.preventDefault()
      e.stopPropagation()

    },
    moveEnd(e) {
      this.setOffsetY(0)
      this.firstOffsetY = null


    },
    onMaskClick(e) {

      if (this.mouseState && (this.mouseState === 2 || this.mouseState === 3)) {
        return
      }

      const offsetX = e.offsetX
      const width = window.innerWidth
      if (offsetX > 0 && offsetX < width * 0.3) {
        this.prevPage()
      } else if (offsetX > 0 && offsetX > width * 0.7) {
        this.nextPage()
      } else {
        this.toggleTitleAndMenu()
      }
    },
    //上一页
    prevPage() {

      if (this.rendition) {
        this.rendition.prev().then(() => {
          this.refreshLocation()
        })
        this.hideTitleAndMenu()
      }

    },
    //下一页
    nextPage() {

      if (this.rendition) {
        this.rendition.next().then(() => {
          this.refreshLocation()
        })


        this.hideTitleAndMenu()

      }
    },
    //点击屏幕
    toggleTitleAndMenu() {
      if (this.menuVisible) {
        this.setSettingVisible(-1)
      }
      this.setMenuVisible(!this.menuVisible)
      this.setFontFamilyVisible(false)
    },

    //初始字体大小
    initFontSize() {
      let fontsize = getFontSize(this.fileName)
      if (!fontsize) {
        saveFontSize(this.filename, this.defaultFontSize)
      } else {
        this.currentBook.rendition.themes.fontSize(fontsize)
        this.setDefaultFontSize(fontsize)
      }
    },
    //初始字体样式
    initFontFamily() {
      let font = getFontFamily(this.fileName)
      if (!font) {
        saveFontFamily(this.filename, this.defaultFontFamily)
      } else {
        this.currentBook.rendition.themes.font(font)
        this.setDefaultFontFamily(font)
      }
    },
    //初始化阅读器主题
    initTheme() {
      let defaultTheme = getTheme(this.fileName)
      if (!defaultTheme) {
        defaultTheme = this.themeList[0].name

        saveTheme(this.fileName, defaultTheme)
      }
      this.setDefaultTheme(defaultTheme)
      this.themeList.forEach(theme => {
        this.rendition.themes.register(theme.name, theme.style)
      })
      this.rendition.themes.select(defaultTheme)

    },


    //初始化阅读器
    initRendition() {
      this.rendition = this.book.renderTo('read', {
        width: innerWidth,
        height: innerHeight,
        method: 'default'
        // flow:'scrolled'


      })


      const location = getLocation(this.fileName)

      if (location) {
        this.display(location, () => {
          this.initTheme()
          this.initFontFamily()
          this.initFontSize()
          this.initGlobalStyle()
        })
      } else {
        this.display(null, () => {
          this.initTheme()
          this.initFontFamily()
          this.initFontSize()
          this.initGlobalStyle()
        })

      }

      this.rendition.hooks.content.register(contents => {
        Promise.all([
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/daysOne.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/cabin.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/montserrat.css`),
          contents.addStylesheet(`${process.env.VUE_APP_RES_URL}/fonts/tangerine.css`)
        ]).then(() => {

          // console.log('字体全部加载完毕...')
        })
      })


    },
    //初始化事件
    initGesture() {
      this.rendition.on('touchstart', e => {
        this.touchStartX = e.changedTouches[0].clientX
        this.touchStartTime = e.timeStamp

      })
      this.rendition.on('touchend', e => {
        const offsetX = e.changedTouches[0].clientX - this.touchStartX
        const time = e.timeStamp - this.touchStartTime
        if (time < 500 && offsetX > 40) {
          this.prevPage()
        } else if (time < 500 && offsetX < -40) {
          this.nextPage()
        } else {
          this.toggleTitleAndMenu()
        }
        e.preventDefault()
        e.stopPropagation()

      })
    },
    //拆解书籍
    parseBook() {
      this.book.loaded.cover.then(cover => {
        this.book.archive.createUrl(cover).then(url => {
          this.setCover(url)
        })
      })
      this.book.loaded.metadata.then(metadata => {
        this.setMetadata(metadata)
      })

      this.book.loaded.navigation.then(nav => {
        const navItem = flatten(nav.toc)

        function find(item, level = 0) {
          return !item.parent ? level : find(navItem.filter(parentItem => parentItem.id === item.parent)[0], ++level)
        }

        navItem.forEach(item => {
          item.level = find(item)
        })

        this.setNavigation(navItem)

      })


    }
    ,
    //初始化内容
    initEpub(url) {

      // const url = `${process.env.VUE_APP_RES_URL}` + '/epub/' + this.fileName + '.epub'

      this.book = new Epub(url)
      //存储信息
      this.setCurrentBook(this.book)
      //初始化阅读
      this.initRendition()
      //初始化方法
      this.initGesture()

      //解析电子书
      this.parseBook()


      this.book.ready.then(() => {
        return this.book.locations.generate(750 * (window.innerWidth / 375) * (getFontSize(this.fileName) / 16))

      }).then(locations => {


        this.navigation.forEach(nav => {
          nav.pagelist = []
        })
        //分页功能实现
        locations.forEach(item => {
          const loc = item.match(/\[(.*)\]!/)[1]
          this.navigation.forEach(nav => {
            if (nav.href) {
              const href = nav.href.match(/^(.*)\.html$/)
              if (href) {
                if (href[1] === loc) {
                  nav.pagelist.push(item)
                }
              }
            }
          })
          let currentPage = 1
          this.navigation.forEach((nav, index) => {
            if (index === 0) {
              nav.page = 1
            } else {
              nav.page = currentPage
            }
            currentPage += nav.pagelist.length + 1
          })
        })
        this.setPagelist(locations)
        this.setBookAvailable(true)
        this.refreshLocation()

      })

    }
  },


  mounted() {
    const books = this.$route.params.fileName.split('|')
    const fileName = books[1]
    getLocalForage(fileName, (err, blob) => {
      if (!err && blob) {
       // console.log('找到离线电子书')
        this.setFileName(books.join('/')).then(() => {
          this.initEpub(blob)
        })
      } else {
       // console.log('在线观看')
        this.setFileName(books.join('/')).then(() => {
          const url = process.env.VUE_APP_EPUB_URL + '/' + this.fileName + '.epub'
          this.initEpub(url)
        })
      }
    })


  }
}

</script>
<style lang="scss" rel="stylesheet/scss" scoped>
@import "../../assets/styles/global.scss";

.ebook-reader {
  width: 100%;
  height: 100%;
  overflow: hidden;

  .ebook-reader-mask {
    position: absolute;
    top: 0;
    left: 0;
    background: transparent;
    z-index: 150;
    width: 100%;
    height: 100%;
  }


}


</style>
