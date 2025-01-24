import { useState } from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/style.scss'

import logoHeader from './assets/img/LogoHeader.svg';
import logoAdmin from './assets/img/admin/logoAdmin.svg'

const baseURL = import.meta.env.VITE_BASE_URL;
const basePath = import.meta.env.VITE_BASE_PATH;

//sweetalert
const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

function App() {
  const [accountData, setAccountData] = useState({username: '' , password: ''}) //暫存登入資訊
  const [isAuth, setIsAuth] = useState(false) //已登入未登入模板切換 (尚未教到路由、登出尚未串api)
  const [productsData, setProductsData] = useState([]) //所有產品資訊
  const [tempProduct, setTempProduct] = useState() //查看單一產品

  //已登入：驗證登入狀態
  const checkLogin = async () => {
    try {
      const token = document.cookie.replace(/(?:^|;\s*)apiToken\s*=\s*([^;]*).*$|^.*$/,"$1"); 
      axios.defaults.headers.common['Authorization'] = token;
      const res = await axios.post(`${baseURL}/api/user/check`)
      Toast.fire({
        icon: "success",
        title: "驗證成功:帳號已登入",
        text: `success: ${res.data.success}`
      });
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "驗證失敗",
        text: error
      });
    }
  }

  //取得產品列表
  const getProductsList = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/${basePath}/admin/products`)
      setProductsData(res.data.products)

    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "產品資料取得失敗",
        text: error.response.data.message
      });
    }
  }

  //未登入：處理登入input value
  const handleInputChange = (e) => {
    let {id, value} = e.target;
    setAccountData( prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  //未登入：執行登入
  const loginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseURL}/admin/signin` , accountData)
      const {token, expired} = res.data;
      document.cookie = `apiToken=${token}; expires=${ new Date (expired)}`; 
      axios.defaults.headers.common['Authorization'] = token;

      Toast.fire({
        icon: "success",
        title: res.data.message,
        text: `登入帳號：${accountData.username}`
      });
      setIsAuth(true)
      setAccountData('')
      getProductsList()
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "登入失敗",
        text: error
      });
    }
  }

  return (
    <>
    { isAuth? (
        <>
          <header className="header pt-3">
            <div className="container">
              <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
                <a href="/" className="d-flex align-items-center mb-2 mb-lg-0 me-5 text-dark text-decoration-none">
                  <img src={logoHeader} alt="logo"/>
                </a>
                <ul className="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
                  <li><a href="#" className="nav-link px-2 link-secondary">產品列表</a></li>
                </ul>
                <button type="submit" className="btn btn-success" onClick={checkLogin}>驗證登入</button>
                <button type="submit" className="btn btn-primary ms-3" onClick={() => {setIsAuth(!isAuth); setTempProduct()}}>登出</button>
              </div>
            </div>
          </header>
          <div className="contentAll">
            <section className="productList container pt-5">
              <div className="row pt-5">
                <div className="col">
                  <div className="d-flex justify-content-between mb-5">
                    <h1 className="h2 my-0">產品列表</h1>
                    {/*
                    <button type="button" className="btn btn-edit">新增產品</button>
                    */}
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th scope="col">主圖</th>
                          <th scope="col">產品名稱</th>
                          <th scope="col">原價</th>
                          <th scope="col">售價</th>
                          <th scope="col">是否啟用</th>
                          <th scope="col">功能</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productsData && productsData.length > 0 ? (
                          productsData.map( item => (
                            <tr key={item.id}>
                              <td><img src={item.imageUrl} width="80" /></td>
                              <td>{item.title}</td>
                              <td>{item.origin_price}</td>
                              <td>{item.price}</td>
                              <td>{item.is_enabled ? <span className="text-success">已啟用</span> : <span className="text-secondary">未啟用</span>}</td>
                              <td>
                              {/*
                                <button type="button" className="btn btn-sm btn-edit-outline me-3">編輯</button>
                                <button type="button" className="btn btn-sm btn-delete-outline  me-3">刪除</button>
                              -*/}
                                <button type="button" className="btn btn-sm btn-primary" onClick={() => setTempProduct(item)}>查看細節</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5"><p className="text-center text-secondary my-0">目前沒有產品</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                </div>
                
                <div className="col">
                  <h1 className="h2 mb-3">單一產品細節</h1>
                  { tempProduct ? (
                    <div className="card">
                      <img src={tempProduct.imageUrl} className="card-img-top" alt={tempProduct.title}/>
                      <div className="card-body">
                        <h5 className="card-title">{tempProduct.title}<span className="badge bg-info ms-2">{tempProduct.category}</span></h5>
                        <p className="card-text">產品描述：{tempProduct.description}</p>
                        <p className="card-text">產品內容：{tempProduct.content}</p>
                        <p className="card-text"><del className="text-secondary">{tempProduct.origin_price} 元</del> / {tempProduct.price}元</p>
                        { tempProduct.imagesUrl?.length > 0 ? (
                          <>
                            <h5 className="card-title">更多圖片：</h5>
                            <div className="d-flex flex-wrap mb-3">
                              {tempProduct.imagesUrl?.map((url, index) => {
                                if (url === "") {return }
                                return <img key={index} className="images object-fit me-3 mb-3" src={url}  alt="更多圖片" />
                              })}
                            </div>
                          </>
                        ) : (
                          ""
                        )}
                        
                        <a href="#" className="btn btn-primary" onClick={() => setTempProduct()}>關閉</a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-secondary">請選擇一個產品查看</p>
                  )}
                </div>
                
              </div>
            </section>
          </div>
          
        </>
      ) : (
        <div className="container-fluid">
          <div className="row row-cols-2">
            <div className="col">
              <div className="AdminLogo">
                <img src={logoAdmin} alt="logo"/>
              </div>
            </div>
            <div className="col">
              <div className="login">
                <h1 className="h2 text-center  text-white">後台管理系統</h1>
                <p className="text-white ">創造專為毛孩打造的智能生活</p>
                <form className="loginForm">
                  <div className="form-floating mb-3">
                    <input 
                      type="email" 
                      className="form-control input" 
                      id="username" 
                      placeholder="name@example.com" 
                      onChange={(e) => {handleInputChange(e)}}
                      required
                    />
                    <label htmlFor="username">Email address</label>
                  </div>
                  <div className="form-floating mb-3">
                    <input 
                      type="password" 
                      className="form-control input" 
                      id="password" 
                      placeholder="Password" 
                      onChange={(e) => {handleInputChange(e)}}
                      required
                    />
                    <label htmlFor="password">Password</label>
                  </div>
                  <button type="submit" className="btn btn-lg btn-primary  w-100" onClick={ (e) => loginSubmit(e)}>登入</button>
                </form>
              </div>
            </div>
          </div>
          

        </div>
        
      )}
    
    </>
  )
}

export default App
