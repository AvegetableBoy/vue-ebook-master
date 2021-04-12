import Vue from 'vue'
import VueRouter from 'vue-router'
// import { component } from 'vue/types/umd'
const ebook = () => import('../views/ebook/index')
const ebookreader = () => import('../components/ebook/EbookReader.vue')
const store = () => import('../views/store/index')
const storeHome = () => import('../views/store/StoreHome')
const storeList = () => import('../views/store/StoreList')
const storeDetail = () => import('../views/store/StoreDetail')
const shelf = () => import('../views/store/StoreShelf')
const category = () => import('../views/store/StoreCategory')
const speaking = () => import('../views/store/StoreSpeaking.vue')
Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: '/store'
  },
  {
    path: '/ebook',
    component: ebook,
    children: [{
      path: ':fileName',
      component: ebookreader
    }

    ]
  },
  {
    path: '/store',
    component: store,
    redirect: '/store/shelf',
    children: [
      {
        path: 'shelf',
        component: shelf

      },

      {
        path: 'home',
        component: storeHome
      },
      {
        path: 'category',
        component: category
      },
      {
        path: 'list',
        component: storeList
      },
      {
        path: 'detail',
        component: storeDetail


      },
      {
        path: 'speaking',
        component: speaking
      },


    ]
  }


]

const router = new VueRouter({
  routes
})

export default router
