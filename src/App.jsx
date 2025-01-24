import { useState, useEffect, useRef } from 'react'
import axios from 'axios';
import { Modal } from 'bootstrap';
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
  // modal
  let defaultData = {
    title: '',
    category:'',
    content:'',
    description:'',
    imageUrl:'',
    imagesUrl:[''], //預設值帶入一個空值，才能顯示第一個input新增圖片
    is_enabled: false,
    origin_price:'',
    price: '',
    unit: '',
    num: '' 
  }

  const productModalRef = useRef(null);
  const deleteProductModalRef = useRef(null);
  const [tempModalData, setTempModalData] = useState(defaultData);
  const [modalMode, setModalMode] = useState(null); //modal模式：新增 create、編輯 edit

  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: 'static',
      keyboard: false,
    }); //建立modal

    // 在模態框關閉時，清理焦點
    productModalRef.current.addEventListener('hidden.bs.modal', () => {
      const title = document.querySelector('.modal-title');
      if (title) {
        title.focus();
      }
    });

    new Modal(deleteProductModalRef.current, {
      backdrop: 'static',
      keyboard: false,
    }); //建立modal

    // 在模態框關閉時，清理焦點
    deleteProductModalRef.current.addEventListener('hidden.bs.modal', () => {
      const title = document.querySelector('.modal-title');
      if (title) {
        title.focus();
      }
    });
    
  }, [])

  //開啟modal：新增、編輯產品
  const openModal = (mode, product) => {
    setModalMode(mode)
    switch (mode) {
      case 'create':
        setTempModalData(defaultData);
        break;
      case 'edit':
        setTempModalData(product);
        break
      default:
        break;
    }
    const modalInstance = Modal.getInstance(productModalRef.current) //取得modal
    modalInstance.show();

    // 將焦點設置到模態框內的第一個可聚焦元素
    setTimeout(() => {
      const title = document.querySelector('.modal-title');
      if (title) {
        title.focus();
      }
    }, 150)

  }
  //關閉modal：新增、編輯產品
  const closeModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current) //取得modal
    modalInstance.hide();

    // 移除模態框焦點並將焦點設置到其他地方
    const triggerButton = document.querySelector('.btn'); // 修改為觸發模態框的按鈕選擇器
    if (triggerButton) {
      triggerButton.focus(); // 將焦點移到觸發按鈕
    }
  }
  //開啟modal：刪除產品
  const openDeleteProductModal = (product) => {
    setTempModalData(product);
    const modalInstance = Modal.getInstance(deleteProductModalRef.current) //取得modal
    modalInstance.show();

    // 將焦點設置到模態框內的第一個可聚焦元素
    setTimeout(() => {
      const title = document.querySelector('.modal-title');
      if (title) {
        title.focus();
      }
    }, 150)
  }
  //關閉modal：刪除產品
  const closeDeleteProductModal = () => {
    const modalInstance = Modal.getInstance(deleteProductModalRef.current) //取得modal
    modalInstance.hide();

    // 移除模態框焦點並將焦點設置到其他地方
    const triggerButton = document.querySelector('.btn'); // 修改為觸發模態框的按鈕選擇器
    if (triggerButton) {
      triggerButton.focus(); // 將焦點移到觸發按鈕
    }
  }
  //modal input
  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setTempModalData( prevData => ({
      ...prevData,
      //若type是checkbox則取得checked的值，否則取得value的值
      [name]: type === "checkbox" ? checked : value 
    }))
  }
  //modal image
  const handleImageChange = (e, index) => {
    const { value } = e.target;
    setTempModalData( prevData => {
      const newImages = [...prevData.imagesUrl];
      newImages[index] = value;
      return { ...prevData, imagesUrl:newImages }
    })
  }
  //modal add image
  const addImage = () => {
    setTempModalData( prevData => {
      const newImages = [...prevData.imagesUrl, ''];
      return { ...prevData, imagesUrl:newImages }
    })
  }
  //modal remove image
  const removeImage = () => {
    setTempModalData( prevData => {
      const newImages = [...prevData.imagesUrl];
      newImages.pop();
      return { ...prevData, imagesUrl:newImages }
    })
  }

  // login
  const [accountData, setAccountData] = useState({username: '' , password: ''}) //暫存登入資訊
  const [isAuth, setIsAuth] = useState(false) //已登入未登入模板切換 (尚未教到路由、登出尚未串)
  
  //驗證登入狀態:儲存token
  useEffect(() => {
    const token = document.cookie.replace(/(?:^|;\s*)apiToken\s*=\s*([^;]*).*$|^.*$/,"$1"); 
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
      checkLogin();
    } else {
      setIsAuth(false);
    }
  }, []);
  //驗證登入狀態
  const checkLogin = async () => {
    try {
      await axios.post(`${baseURL}/api/user/check`)
      getProductsList();
      setIsAuth(true);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "驗證失敗",
        text: error
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

  // product
  const [productsData, setProductsData] = useState([]) //所有產品資訊

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

  //新增產品
  const createProduct = async () => {
    try {
      await axios.post(`${baseURL}/api/${basePath}/admin/product`, { 
        data: {
          ...tempModalData,
          origin_price: Number(tempModalData.origin_price),
          price: Number(tempModalData.price),
          is_enabled: tempModalData.is_enabled ? 1 : 0
        } 
      } )
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "新增產品失敗",
        text: error.response.data.message
      });
    }
  }
  //更新產品
  const updateProduct = async () => {
    try {
      await axios.put(`${baseURL}/api/${basePath}/admin/product/${tempModalData.id}`, { 
        data: {
          ...tempModalData,
          origin_price: Number(tempModalData.origin_price),
          price: Number(tempModalData.price),
          is_enabled: tempModalData.is_enabled ? 1 : 0
        } 
      } )
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "更新產品失敗",
        text: error.response.data.message
      });
    }
  }
  //刪除產品
  const deleteProduct = async () => {
    try {
      await axios.delete(`${baseURL}/api/${basePath}/admin/product/${tempModalData.id}`)
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "刪除產品失敗",
        text: error.response.data.message
      });
    }
  }
  
  // modal送出確認：刪除產品
  const handleDeleteProduct = async () => {
    try {
      await deleteProduct();
      getProductsList();
      closeDeleteProductModal();
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "刪除產品失敗",
        text: error.response.data.message
      });
    }
  }

  // modal送出確認：新增或更新產品
  const handleUpdateProduct = async () => {
    //判斷：新增或更新產品
    const apiCall = modalMode === 'create' ? createProduct : updateProduct
    try {
      await apiCall();
      getProductsList();
      closeModal();
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "更新產品失敗",
        text: error.response.data.message
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
                <button type="submit" className="btn btn-primary ms-3" >登出</button>
              </div>
            </div>
          </header>
          <div className="contentAll pb-5">
            <section className="productList container py-5">
              <div className="row pt-5">
                <div className="col">
                  <div className="d-flex justify-content-between mb-5">
                    <h1 className="h2 my-0">產品列表</h1>
                    <button type="button" className="btn btn-edit" onClick={() => openModal('create')}>新增產品</button>
                  </div>
                  
                  <div className="table-responsive">
                    <table className="table align-middle productTable">
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
                          productsData.map( product => (
                            <tr key={product.id}>
                              <td width={100}><img src={product.imageUrl} width="80" className="rounded-3" /></td>
                              <td>{product.title}</td>
                              <td>{product.origin_price}</td>
                              <td>{product.price}</td>
                              <td>{product.is_enabled ? <span className="text-success">已啟用</span> : <span className="text-secondary">未啟用</span>}</td>
                              <td>
                                <button type="button" className="btn btn-sm btn-edit-outline me-3" 
                                  onClick={() => openModal('edit', product)}>編輯</button>
                                <button type="button" className="btn btn-sm btn-delete-outline me-3"
                                  onClick={() => openDeleteProductModal(product)}>刪除</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6"><p className="text-center text-secondary my-0">目前沒有產品</p></td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
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

      <div className="modal fade" tabIndex="-1" ref={productModalRef} id="productModal">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" tabIndex="0">
                {modalMode === 'create' ? '新增產品' : '編輯產品'}
              </h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <div className="modal-body">
              <div className="row row-cols-2">
                <div className="col-3">
                  <label htmlFor="main-image" className="form-label">主圖</label>
                  <div className="input-group mb-3">
                    <input type="text" name="imageUrl"  id="main-image" 
                      value={tempModalData.imageUrl}
                      onChange={handleModalInputChange}
                      className="form-control" 
                      placeholder="請輸入圖片連結"/>
                  </div>
                  <img className="img-fluid rounded-3" 
                    src={tempModalData.imageUrl} 
                    alt={tempModalData.title}/>
                  <hr />
                  <div className="h6">副圖</div>
                  <div className="row row-cols-2">
                    {tempModalData.imagesUrl.map((img, index) => (
                      <div className="col p-2 rounded-3" key={index}>
                        <input type="text" value={img}
                            onChange={ (e) => handleImageChange(e, index) }
                            className="form-control mb-1" 
                            placeholder={`圖片網址 ${index+1}`} />
                        {img && (
                          <img className="img-fluid rounded-3" 
                          src={img}
                          alt={`副圖${index+1}`} />
                        )}
                        
                      </div> 
                    ))}
                  </div>
                  <div className="d-flex justify-content-between">
                    { tempModalData.imagesUrl.length < 5 && 
                      tempModalData.imagesUrl[tempModalData.imagesUrl.length-1] !== '' && (
                      <button type="button" 
                        onClick={addImage}
                        className="btn btn-sm btn-edit w-100 rounded-0">新增</button>
                    )}
                    { tempModalData.imagesUrl.length > 1 && (
                      <button type="button" 
                        onClick={removeImage}
                        className="btn btn-sm btn-delete w-100 rounded-0">移除</button>
                    ) }
                    
                  </div>
                  
                </div>
                <div className="col-9">
                  <label htmlFor="title" className="form-label">標題</label>
                  <div className="input-group mb-3">
                    <input type="text" name="title" id="title" 
                      value={tempModalData.title}
                      onChange={handleModalInputChange}
                      className="form-control" placeholder="請輸入標題"/>
                  </div>
                  <label htmlFor="category" className="form-label">分類</label>
                  <div className="input-group mb-3">
                    <input type="text" name="category" id="category" 
                      value={tempModalData.category}
                      onChange={handleModalInputChange}
                      className="form-control" placeholder="請輸入分類"/>
                  </div>
                  <div className="row row-cols-3">
                    <div className="col">
                      <label htmlFor="origin_price" className="form-label">原價</label>
                      <div className="input-group mb-3">
                        <input type="number" name="origin_price" id="origin_price" 
                          value={tempModalData.origin_price}
                          onChange={handleModalInputChange}
                          className="form-control" placeholder="請輸入原價"/>
                      </div>
                    </div>
                    <div className="col">
                      <label htmlFor="price" className="form-label">售價</label>
                      <div className="input-group mb-3">
                        <input type="number" name="price" id="price" 
                          value={tempModalData.price}
                          onChange={handleModalInputChange}
                          className="form-control" placeholder="請輸入售價"/>
                      </div>
                    </div>
                    <div className="col">
                      <label htmlFor="unit" className="form-label">單位</label>
                      <div className="input-group mb-3">
                        <input type="text" name="unit" id="unit" 
                          value={tempModalData.unit}
                          onChange={handleModalInputChange}
                          className="form-control" placeholder="請輸入單位"/>
                      </div>
                    </div>
                  </div>
                  <label htmlFor="description" className="form-label">產品描述</label>
                  <div className="input-group mb-3">
                    <input type="text" name="description" id="description" 
                      value={tempModalData.description}
                      onChange={handleModalInputChange}
                      className="form-control" placeholder="請輸入產品描述"/>
                  </div>
                  <label htmlFor="content" className="form-label">產品說明</label>
                  <div className="input-group mb-3">
                    <textarea name="content" id="content" className="form-control" 
                      value={tempModalData.content}
                      onChange={handleModalInputChange}
                      placeholder="請輸入產品說明" rows={4}></textarea>
                  </div>
                  <div className="form-check">
                    <input type="checkbox" name="is_enabled" id="isEnabled"  
                      checked={tempModalData.is_enabled}
                      onChange={handleModalInputChange}
                      className="form-check-input" />
                    <label className="form-check-label" htmlFor="isEnabled">是否啟用</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>取消</button>
              <button type="button" className="btn btn-edit" onClick={handleUpdateProduct}>確認</button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal fade" tabIndex="-1" ref={deleteProductModalRef} id="delProductModal">
        <div className="modal-dialog ">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" tabIndex="0">刪除產品</h5>
              <button type="button" className="btn-close" onClick={closeDeleteProductModal}></button>
            </div>
            <div className="modal-body">
              是否刪除產品 <span className="text-danger fw-bold">{tempModalData.title}</span>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-delete" onClick={handleDeleteProduct}>刪除</button>
              <button type="button" className="btn btn-secondary" onClick={closeDeleteProductModal}>取消</button>
            </div>
          </div>
        </div>
      </div>
    
    </>
  )
}

export default App
