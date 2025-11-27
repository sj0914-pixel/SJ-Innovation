/* logic.js - Emergency Restore Version */
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// [0] 전역 상수 및 유틸리티
// ----------------------------------------------------
const useLucide = () => { 
    useEffect(() => { 
        if (window.lucide) window.lucide.createIcons(); 
    }); 
};

// [안전장치] DB 연결 전 보여줄 임시 빈 값
const DEFAULT_BANNERS = { top: "", middle: "" };

const COURIERS = ["CJ대한통운", "우체국택배", "한진택배", "로젠택배", "롯데택배", "직접전달", "화물배송"];

const BANK_INFO = {
    bankName: "신한은행",
    accountNumber: "110-123-456789",
    holder: "SJ이노베이션"
};

const CATEGORIES = ["전체", "유아동의류", "완구/교구", "주방/식기", "생활/건강"];

const Icon = ({ name, ...props }) => {
    const iconName = name === "Boxes" ? "ShoppingCart" : (name.charAt(0).toLowerCase() + name.slice(1));
    return <i data-lucide={iconName} {...props}></i>;
};

const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price);

const formatDate = (dateInput) => {
    try {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return ""; 
        return d.toISOString().slice(0, 10);
    } catch (e) { return ""; }
};

// ----------------------------------------------------
// [1] 공통 컴포넌트 (오류 방지형 이미지 업로더)
// ----------------------------------------------------
const ImageUploader = ({ label, onImageSelect, currentImage }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(currentImage || "");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => { setPreview(currentImage); }, [currentImage]);

    const handleFile = (file) => {
        if (!file) return;
        // 3MB 제한
        if (file.size > 3 * 1024 * 1024) {
            alert("이미지 용량이 3MB를 초과합니다.\n더 작은 이미지를 사용해주세요.");
            if(fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const result = e.target.result;
            // 5MB 안전 제한
            if (result.length > 5000000) { 
                alert("이미지 크기가 너무 큽니다.");
                setPreview("");
                onImageSelect("");
            } else {
                setPreview(result);
                onImageSelect(result); 
            }
            setIsLoading(false);
        };
        
        reader.onerror = () => {
            alert("이미지 읽기 실패");
            setIsLoading(false);
        };

        reader.readAsDataURL(file);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm("삭제하시겠습니까?")) {
            setPreview("");
            onImageSelect("");
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="mb-4">
            <label className="block mb-1 font-bold text-sm text-slate-700">{label}</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center h-32 cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden bg-white group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current.click()}>
                {isLoading ? (
                    <span className="text-xs font-bold text-indigo-600">업로드 중...</span>
                ) : (
                    preview && !preview.includes("📦") ? ( 
                        <div className="relative w-full h-full">
                            <img src={preview} className="absolute inset-0 w-full h-full object-cover bg-slate-50" alt="preview" />
                            <button onClick={handleDelete} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 z-10"><Icon name="X" className="w-4 h-4" /></button>
                        </div>
                    ) : ( 
                        <div className="text-center p-4">
                            <Icon name="Image" className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500 font-medium">클릭하여 등록</p>
                        </div> 
                    )
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [2] 마이페이지
// ----------------------------------------------------
const MyPage = ({ user, onClose }) => {
    const [myOrders, setMyOrders] = useState([]);
    const [tab, setTab] = useState("info");
    useLucide();

    useEffect(() => {
        if(!window.fb || !window.auth.currentUser) return;
        const { collection, query, where, onSnapshot } = window.fb;
        if(window.auth.currentUser.uid) {
            const q = query(collection(window.db, "orders"), where("userId", "==", window.auth.currentUser.uid));
            const unsub = onSnapshot(q, (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.date) - new Date(a.date));
                setMyOrders(list);
            });
            return () => unsub();
        }
    }, []);

    const handleCancelOrder = async (id) => {
        if(!confirm("취소하시겠습니까?")) return;
        try { await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { status: "주문취소" }); } catch(e) { alert("실패"); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-xl">마이페이지</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><Icon name="X" /></button>
                </div>
                <div className="flex border-b">
                    <button onClick={()=>setTab("info")} className={`flex-1 py-3 font-bold ${tab==="info"?"border-b-2 border-slate-800 text-slate-900":"text-slate-400"}`}>내 정보</button>
                    <button onClick={()=>setTab("orders")} className={`flex-1 py-3 font-bold ${tab==="orders"?"border-b-2 border-slate-800 text-slate-900":"text-slate-400"}`}>주문 내역</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {tab === "info" ? (
                        <div className="space-y-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">상호명</div><div className="font-bold">{user.storeName}</div></div>
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">대표자</div><div className="font-bold">{user.repName}</div></div>
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">이메일</div><div className="font-bold">{user.email}</div></div>
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">연락처</div><div className="font-bold">{user.mobile || "정보 없음"}</div></div>
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">주소</div><div className="font-bold">{user.address || "정보 없음"}</div></div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myOrders.length === 0 ? <div className="text-center text-slate-400 py-10">내역 없음</div> : 
                            myOrders.map(order => (
                                <div key={order.id} className="border rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                                        <span className="text-xs text-slate-500">{new Date(order.date).toLocaleString()}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${order.status==='접수대기'?'bg-blue-100 text-blue-600':order.status==='주문취소'?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}`}>{order.status}</span>
                                    </div>
                                    <div className="space-y-1 mb-3 text-sm">
                                        {(order.items || []).map((item, i) => (
                                            <div key={i} className="flex justify-between"><span className="truncate w-2/3">{item.name}</span><span className="text-slate-500">{item.quantity}개</span></div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <span className="font-bold">총 {formatPrice(order.totalAmount)}원</span>
                                        {order.status === "접수대기" && <button onClick={()=>handleCancelOrder(order.id)} className="text-xs bg-slate-200 px-3 py-1 rounded hover:bg-slate-300">주문취소</button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [3] 관리자 페이지
// ----------------------------------------------------
const AdminPage = ({ onLogout, onToShop }) => {
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [bannerConfig, setBannerConfig] = useState(DEFAULT_BANNERS);
    const [tab, setTab] = useState("orders");
    
    const [topBanner, setTopBanner] = useState("");
    const [middleBanner, setMiddleBanner] = useState("");
    
    const getToday = () => {
        const d = new Date();
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    };

    const [searchInputs, setSearchInputs] = useState({ status: "전체", dateType: "오늘", startDate: getToday(), endDate: getToday(), searchType: "주문자명", keyword: "" });
    const [appliedFilters, setAppliedFilters] = useState({ status: "전체", dateType: "오늘", startDate: getToday(), endDate: getToday(), searchType: "주문자명", keyword: "" });

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [thumbImage, setThumbImage] = useState("");
    const [detailImage, setDetailImage] = useState("");
    const excelInputRef = useRef(null);
    useLucide();

    useEffect(() => {
        if(!window.fb) return;
        const { collection, onSnapshot, doc } = window.fb;
        const unsubProd = onSnapshot(collection(window.db, "products_final_v5"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubUser = onSnapshot(collection(window.db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubOrder = onSnapshot(collection(window.db, "orders"), (snap) => {
            let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a,b) => new Date(b.date) - new Date(a.date));
            setOrders(list);
        });

        // [안전 장치 추가] 배너 DB 연결 시 에러나도 빈 값으로 처리
        const unsubBanner = onSnapshot(doc(window.db, "config", "banners"), (d) => {
            if(d.exists()) {
                const data = d.data();
                // 데이터가 있으면 그걸 쓰고, 없으면 빈 문자열("")
                setBannerConfig({ top: data.top || "", middle: data.middle || "" });
                setTopBanner(data.top || "");
                setMiddleBanner(data.middle || "");
            } else {
                // 문서가 아예 없으면 기본 빈 값
                setBannerConfig(DEFAULT_BANNERS);
            }
        });

        return () => { unsubProd(); unsubUser(); unsubOrder(); unsubBanner(); };
    }, []);

    const filteredOrders = orders.filter(o => {
        if (appliedFilters.status !== "전체" && o.status !== appliedFilters.status) return false;
        if (appliedFilters.startDate && appliedFilters.endDate) {
            const orderDate = formatDate(new Date(o.date));
            if (orderDate < appliedFilters.startDate || orderDate > appliedFilters.endDate) return false;
        }
        return true;
    });

    const handleSaveBanners = async () => {
        try {
            await window.fb.setDoc(window.fb.doc(window.db, "config", "banners"), {
                top: topBanner || "",
                middle: middleBanner || ""
            });
            alert("배너 설정이 저장되었습니다.");
        } catch(e) {
            alert("배너 저장 실패: " + e.message);
        }
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault(); const form = e.target;
        const newProd = { 
            name: form.pName.value, category: form.pCategory.value, price: Number(form.pPrice.value)||0, 
            originPrice: Number(form.pOriginPrice.value)||0, stock: Number(form.pStock.value)||0, 
            minQty: Number(form.pMinQty.value)||1, cartonQty: Number(form.pCartonQty.value)||1, 
            image: thumbImage || "📦", detailImage: detailImage || "", description: form.pDescription.value, rating: "5.0",
            isHidden: form.pIsHidden.checked 
        };
        try { 
            if (editingProduct) await window.fb.updateDoc(window.fb.doc(window.db, "products_final_v5", editingProduct.id), newProd); 
            else await window.fb.addDoc(window.fb.collection(window.db, "products_final_v5"), newProd); 
            setIsProductModalOpen(false); alert("저장됨"); 
        } catch (err) { alert(err.message); }
    };

    const openAddModal = () => { setEditingProduct(null); setThumbImage(""); setDetailImage(""); setIsProductModalOpen(true); };
    const openEditModal = (p) => { setEditingProduct(p); setThumbImage(p.image); setDetailImage(p.detailImage); setIsProductModalOpen(true); };

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex items-center gap-3"><span className="bg-red-500 text-xs px-2 py-1 rounded font-bold">ADMIN</span><span className="font-bold text-lg">SJ 파트너스 관리자</span></div>
                <div className="flex gap-2">
                    <button onClick={onToShop} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm font-bold flex gap-2 items-center"><Icon name="Store" className="w-4 h-4"/>쇼핑몰</button>
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">로그아웃</button>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
                <div className="flex gap-2 border-b border-slate-300 pb-1 overflow-x-auto">
                    {["orders", "users", "products", "banners"].map(t => (
                        <button key={t} onClick={()=>setTab(t)} className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase transition-colors whitespace-nowrap ${tab===t ? "bg-white text-slate-900 border border-b-0 border-slate-300 shadow-sm" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}>
                            {t === 'orders' ? '주문 통합 관리' : t === 'users' ? '회원 관리' : t === 'products' ? '상품 관리' : '배너 관리'}
                        </button>
                    ))}
                </div>

                {tab === "orders" && (
                    <div className="bg-white rounded-lg border shadow-sm p-4">
                        <h3 className="font-bold text-lg mb-4">주문 내역</h3>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 font-bold text-slate-500"><tr><th className="p-3">주문일시</th><th className="p-3">주문자</th><th className="p-3">상품</th><th className="p-3">금액</th><th className="p-3">상태</th></tr></thead>
                            <tbody>
                                {filteredOrders.map(o => (
                                    <tr key={o.id} className="border-b">
                                        <td className="p-3">{new Date(o.date).toLocaleString()}</td>
                                        <td className="p-3">{o.userName}</td>
                                        <td className="p-3">{(o.items||[]).map(i=>`${i.name}(${i.quantity})`).join(", ")}</td>
                                        <td className="p-3">{formatPrice(o.totalAmount)}원</td>
                                        <td className="p-3">{o.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === "users" && <div className="bg-white p-4 rounded text-center text-slate-500">회원 관리 기능</div>}
                {tab === "products" && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-lg">상품 목록</h3>
                            <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold text-sm">+ 상품 등록</button>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 uppercase font-bold text-slate-500"><tr><th className="p-4">이미지</th><th className="p-4">상품명</th><th className="p-4">가격</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {products.map(p=>(
                                    <tr key={p.id}>
                                        <td className="p-4 text-2xl">{p.image ? <img src={p.image} className="w-10 h-10 object-cover rounded"/> : "📦"}</td>
                                        <td className="p-4">{p.name}</td>
                                        <td className="p-4">₩{formatPrice(p.price)}</td>
                                        <td className="p-4"><button onClick={()=>openEditModal(p)} className="bg-slate-200 px-3 py-1 rounded text-xs font-bold">수정</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {tab === "banners" && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">쇼핑몰 배너 관리</h3>
                            <button onClick={handleSaveBanners} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg">설정 저장</button>
                        </div>
                        <div className="space-y-8">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold mb-2 flex items-center gap-2"><Icon name="LayoutTemplate" className="w-5 h-5"/> 메인 상단 배너</h4>
                                <ImageUploader label="상단 배너 이미지 업로드" currentImage={topBanner} onImageSelect={setTopBanner} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold mb-2 flex items-center gap-2"><Icon name="CreditCard" className="w-5 h-5"/> 중간 띠 배너</h4>
                                <ImageUploader label="중간 배너 이미지 업로드" currentImage={middleBanner} onImageSelect={setMiddleBanner} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setIsProductModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><Icon name="X"/></button>
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">{editingProduct ? "상품 수정" : "상품 등록"}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 rounded border">
                                <input type="checkbox" id="pIsHidden" name="pIsHidden" defaultChecked={editingProduct?.isHidden} className="w-5 h-5 accent-red-600" />
                                <label htmlFor="pIsHidden" className="font-bold text-slate-700">판매 중지</label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block mb-1 font-bold">카테고리</label><select name="pCategory" defaultValue={editingProduct?.category} className="w-full border p-2 rounded">{CATEGORIES.filter(c=>c!=="전체").map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                <div><label className="block mb-1 font-bold">재고</label><input name="pStock" type="number" defaultValue={editingProduct?.stock || 0} className="w-full border p-2 rounded" required /></div>
                            </div>
                            <div><label className="block mb-1 font-bold">상품명</label><input name="pName" defaultValue={editingProduct?.name} className="w-full border p-2 rounded" required /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block mb-1 font-bold">공급가</label><input name="pPrice" type="number" defaultValue={editingProduct?.price} className="w-full border p-2 rounded" required /></div>
                                <div><label className="block mb-1 font-bold">권장가</label><input name="pOriginPrice" type="number" defaultValue={editingProduct?.originPrice} className="w-full border p-2 rounded" required /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div><label className="block mb-1 font-bold">최소주문(MOQ)</label><input name="pMinQty" type="number" defaultValue={editingProduct?.minQty || 20} className="w-full border p-2 rounded" /></div>
                                <div><label className="block mb-1 font-bold">1카톤 수량</label><input name="pCartonQty" type="number" defaultValue={editingProduct?.cartonQty || 20} className="w-full border p-2 rounded" /></div>
                            </div>
                            <ImageUploader label="썸네일 이미지" currentImage={thumbImage} onImageSelect={setThumbImage} />
                            <ImageUploader label="상세페이지 이미지" currentImage={detailImage} onImageSelect={setDetailImage} />
                            <div><label className="block mb-1 font-bold">소개 문구</label><textarea name="pDescription" defaultValue={editingProduct?.description} className="w-full border p-2 rounded h-20"></textarea></div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-indigo-700">{editingProduct ? "수정 저장" : "신규 등록"}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------
// [4] 로그인 페이지
// ----------------------------------------------------
const LoginPage = ({ onAdminLogin, onImmediateLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isAddrOpen, setIsAddrOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const addrWrapRef = useRef(null);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', mobile: '', email: '', zipcode: '', address: '', addressDetail: '', businessType: '문구/팬시점', storeName: '', repName: '', businessNumber: '', recommender: '' });
    useLucide();

    useEffect(() => {
        if(isAddrOpen && addrWrapRef.current && window.daum) {
            addrWrapRef.current.innerHTML = '';
            new window.daum.Postcode({
                oncomplete: function(data) {
                    let addr = data.userSelectedType==='R'?data.roadAddress:data.jibunAddress;
                    if(data.buildingName) addr+=` (${data.buildingName})`;
                    setFormData(prev=>({...prev, zipcode: data.zonecode, address: addr}));
                    setIsAddrOpen(false); 
                }, width: '100%', height: '100%'
            }).embed(addrWrapRef.current);
        }
    }, [isAddrOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        if(isLoginMode && formData.username === 'sj' && formData.password === '0914') { onAdminLogin(); return; }
        try {
            if(isLoginMode) {
                await window.fb.setPersistence(window.auth, window.fb.browserSessionPersistence);
                await window.fb.signInUser(window.auth, formData.username, formData.password);
            } else {
                const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
                if(!pwdRegex.test(formData.password)) { alert("비밀번호는 영문+숫자 8자리 이상이어야 합니다."); setLoading(false); return; }
                if(formData.password !== formData.confirmPassword) { alert("비밀번호 불일치"); setLoading(false); return; }
                const cred = await window.fb.createUser(window.auth, formData.email, formData.password);
                const newUser = {
                    email: formData.email, displayId: formData.email.split("@")[0], name: formData.name, mobile: formData.mobile,
                    address: `${formData.address} ${formData.addressDetail}`, businessType: formData.businessType,
                    storeName: formData.storeName, repName: formData.repName, businessNumber: formData.businessNumber,
                    recommender: formData.recommender, joinedAt: new Date().toISOString(), status: "승인대기", isAdmin: false
                };
                await window.fb.setDoc(window.fb.doc(window.db, "users", cred.user.uid), newUser);
                alert("가입 완료!"); onImmediateLogin({ ...cred.user, ...newUser });
            }
        } catch(err) { alert("오류: " + err.message); setLoading(false); }
    };
    const handleChange = (e) => setFormData(prev=>({...prev, [e.target.name]: e.target.value}));

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
            <div className={`bg-white rounded-2xl shadow-xl w-full mx-auto transition-all ${isLoginMode?'max-w-md p-8':'max-w-3xl p-8'}`}>
                <div className="text-center mb-8"><div className="bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">S</div><h1 className="text-2xl font-bold text-slate-800">{isLoginMode?"SJ 파트너 로그인":"사업자 회원등록"}</h1></div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isLoginMode ? (
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1">아이디 (이메일)</label><input name="username" className="w-full p-3 border rounded" onChange={handleChange} required /></div>
                            <div><label className="block text-sm font-bold mb-1">비밀번호</label><input name="password" type="password" className="w-full p-3 border rounded" onChange={handleChange} required /></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <section className="bg-slate-50 p-6 rounded-xl border">
                                <h3 className="font-bold mb-4 border-b pb-2">필수정보</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold mb-1">이름</label><input name="name" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">연락처</label><input name="mobile" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">이메일</label><input name="email" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">비밀번호</label><input name="password" type="password" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">확인</label><input name="confirmPassword" type="password" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                </div>
                                <div className="mt-4"><label className="block text-sm font-bold mb-1">주소</label><div className="flex gap-2 mb-2"><input value={formData.zipcode} readOnly className="w-24 p-2 border bg-slate-100 rounded"/><button type="button" onClick={()=>setIsAddrOpen(true)} className="bg-slate-600 text-white px-3 rounded text-sm">검색</button></div><input value={formData.address} readOnly className="w-full p-2 border bg-slate-100 rounded mb-2"/><input name="addressDetail" className="w-full p-2 border rounded" placeholder="상세" onChange={handleChange}/></div>
                                <div className="mt-4 pt-4 border-t"><label className="block text-sm font-bold mb-1 text-indigo-900">추천인</label><input name="recommender" className="w-full p-2 border border-indigo-200 bg-indigo-50 rounded" placeholder="영업 담당자 이름" onChange={handleChange}/></div>
                            </section>
                            <section className="bg-slate-50 p-6 rounded-xl border">
                                <h3 className="font-bold mb-4 border-b pb-2">사업자 정보</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold mb-1">상호명</label><input name="storeName" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">대표자</label><input name="repName" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">사업자번호</label><input name="businessNumber" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                </div>
                            </section>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold mt-6">{loading?"처리중...":(isLoginMode?"로그인":"가입완료")}</button>
                </form>
                <div className="mt-6 text-center text-sm"><button onClick={()=>setIsLoginMode(!isLoginMode)} className="underline font-bold text-slate-600">{isLoginMode?"회원가입":"로그인"}</button></div>
            </div>
            {isAddrOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="bg-white w-full max-w-lg h-[500px] rounded-xl overflow-hidden relative flex flex-col"><div className="p-3 border-b flex justify-between font-bold bg-slate-50"><span>주소 검색</span><button onClick={()=>setIsAddrOpen(false)}><Icon name="X"/></button></div><div ref={addrWrapRef} className="flex-1 w-full bg-slate-100"></div></div></div>}
        </div>
    );
};

// ----------------------------------------------------
// [5] 상세 페이지
// ----------------------------------------------------
const ProductDetail = ({ product, onBack, onAddToCart, goHome }) => {
    const [qty, setQty] = useState(product.minQty || 1);
    useLucide();
    
    const handleQuantityChange = (delta) => {
        const min = product.minQty || 1;
        const max = (product.cartonQty || 1) * 5;
        const newQuantity = qty + delta;
        if (delta > 0) { if (newQuantity <= max) setQty(newQuantity); else alert(`최대 ${max}개`); } 
        else { if (newQuantity >= min) setQty(newQuantity); else alert(`최소 ${min}개`); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-right duration-300 min-h-screen flex flex-col pb-[80px]">
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b px-4 h-14 flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><Icon name="ArrowLeft" /></button>
                <div className="font-bold text-lg cursor-pointer" onClick={goHome}>SJ Innovation</div>
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><Icon name="X" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-slate-50 aspect-square w-full flex items-center justify-center mb-6 overflow-hidden">
                        {product.image ? <img src={product.image} className="w-full h-full object-contain" /> : <span className="text-[8rem]">📦</span>}
                    </div>
                    <div className="px-5 pb-8">
                        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
                        <div className="flex items-end gap-3 mb-6 pb-6 border-b"><span className="text-2xl font-bold">₩{formatPrice(product.price)}</span><span className="text-slate-400 line-through">₩{formatPrice(product.originPrice)}</span></div>
                        <div className="bg-indigo-50 text-indigo-900 px-4 py-3 rounded-lg mb-8 text-sm"><span className="font-bold block">최소 {product.minQty}개 발주 가능</span></div>
                        <div className="space-y-8">
                            <div><h3 className="text-lg font-bold mb-3">설명</h3><p className="bg-slate-50 p-5 rounded-xl text-sm">{product.description}</p></div>
                            {product.detailImage && <div><h3 className="text-lg font-bold mb-3">상세</h3><img src={product.detailImage} className="w-full rounded-xl" /></div>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-30 safe-area-bottom">
                <div className="max-w-3xl mx-auto flex gap-3">
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1"><button onClick={()=>handleQuantityChange(-1)} className="w-9 h-9 bg-white rounded flex items-center justify-center"><Icon name="Minus"/></button><span className="font-bold w-8 text-center">{qty}</span><button onClick={()=>handleQuantityChange(1)} className="w-9 h-9 bg-white rounded flex items-center justify-center"><Icon name="Plus"/></button></div>
                    <button onClick={()=>{onAddToCart(product, qty);}} className="flex-1 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Icon name="ShoppingCart" /> 담기</button>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [6] 쇼핑몰 페이지
// ----------------------------------------------------
const ShopPage = ({ products, user, onLogout, isAdmin, onToAdmin }) => {
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [depositor, setDepositor] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showMyPage, setShowMyPage] = useState(false);
    const [banners, setBanners] = useState(DEFAULT_BANNERS); // [안전장치] 초기값 설정
    const [toast, setToast] = useState("");
    useLucide();

    useEffect(() => {
        if(window.fb) {
            const { doc, onSnapshot } = window.fb;
            // [안전 장치 추가] 배너 DB 연결 시 에러나도 멈추지 않음
            const unsub = onSnapshot(doc(window.db, "config", "banners"), (d) => {
                if(d.exists()) {
                    setBanners(d.data());
                } else {
                    setBanners(DEFAULT_BANNERS);
                }
            });
            return () => unsub();
        }
    }, []);

    const addToCart = (p, q) => {
        setCart(prev => {
            const idx = prev.findIndex(i => i.id === p.id);
            if (idx > -1) { const n = [...prev]; n[idx].quantity += q; return n; }
            return [...prev, { ...p, quantity: q }];
        });
        setToast("담겼습니다"); setTimeout(()=>setToast(""), 2000);
    };

    const handleFinalOrder = async () => {
        if (!depositor.trim()) return alert("입금자명 입력");
        if(!confirm("주문하시겠습니까?")) return;
        try {
            await window.fb.addDoc(window.fb.collection(window.db, "orders"), {
                userId: window.auth.currentUser ? window.auth.currentUser.uid : "guest",
                userEmail: user.email, userName: user.storeName, items: cart,
                totalAmount: cart.reduce((a,c)=>a+c.price*c.quantity,0),
                date: new Date().toISOString(), status: "접수대기", paymentMethod: "무통장", depositor: depositor, bankInfo: BANK_INFO
            });
            alert("주문완료"); setCart([]); setIsCartOpen(false); setIsOrderModalOpen(false);
        } catch(e) { alert("실패"); }
    };

    const filtered = products.filter(p => !p.isHidden && (selectedCategory==="전체" || p.category===selectedCategory) && p.name.includes(searchTerm));

    if (selectedProduct) return <>
        <ProductDetail product={selectedProduct} onBack={()=>setSelectedProduct(null)} onAddToCart={addToCart} goHome={()=>setSelectedProduct(null)} />
        {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full z-[60]">{toast}</div>}
    </>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <header className="sticky top-0 z-40 bg-white shadow-sm border-b px-4 h-16 flex items-center justify-between">
                <div className="font-bold text-lg cursor-pointer" onClick={()=>window.scrollTo(0,0)}>SJ Innovation</div>
                <div className="flex items-center gap-4">
                    {isAdmin && <button onClick={onToAdmin} className="bg-red-500 text-white px-3 py-1 rounded text-xs">관리자</button>}
                    <button onClick={()=>setIsCartOpen(true)} className="relative p-2"><Icon name="ShoppingCart" />{cart.length>0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1 rounded-full">{cart.length}</span>}</button>
                    <button onClick={()=>setShowMyPage(true)} className="p-2"><Icon name="User" /></button>
                    <button onClick={onLogout} className="bg-slate-200 px-3 py-1 rounded text-sm">로그아웃</button>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* [안전장치] 배너가 없어도 에러나지 않음 */}
                {banners?.top && <div className="mb-8 rounded-2xl overflow-hidden shadow-lg bg-slate-200 h-40 sm:h-52"><img src={banners.top} className="w-full h-full object-cover"/></div>}
                
                <div className="flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide">
                    {CATEGORIES.map(c => <button key={c} onClick={() => setSelectedCategory(c)} className={`px-5 py-2 rounded-full text-sm font-bold border ${selectedCategory===c?"bg-slate-800 text-white":"bg-white"}`}>{c}</button>)}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map((p, idx) => (
                        <React.Fragment key={p.id}>
                            <div onClick={() => setSelectedProduct(p)} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col cursor-pointer">
                                <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                                    {p.image ? <img src={p.image} className="w-full h-full object-contain" /> : <span className="text-6xl">📦</span>}
                                </div>
                                <div className="p-4">
                                    <div className="text-xs text-slate-400 mb-1">{p.category}</div>
                                    <h3 className="font-bold mb-2 line-clamp-2">{p.name}</h3>
                                    <div className="font-bold text-lg">₩{formatPrice(p.price)}</div>
                                </div>
                            </div>
                            {/* [안전장치] 중간 배너 */}
                            {idx === 7 && banners?.middle && <div className="col-span-full my-6 rounded-2xl overflow-hidden bg-slate-200 h-32 sm:h-40"><img src={banners.middle} className="w-full h-full object-cover"/></div>}
                        </React.Fragment>
                    ))}
                </div>
            </main>
            {isCartOpen && <div className="fixed inset-0 z-50 flex justify-end"><div className="absolute inset-0 bg-black/30" onClick={()=>setIsCartOpen(false)}></div><div className="relative w-full max-w-md bg-white h-full shadow-2xl p-5 flex flex-col"><div className="flex justify-between border-b pb-4 mb-4"><h2 className="font-bold">장바구니</h2><button onClick={()=>setIsCartOpen(false)}><Icon name="X"/></button></div><div className="flex-1 overflow-y-auto space-y-4">{cart.map((i,idx)=><div key={idx} className="flex gap-4 border-b pb-4"><div className="w-16 h-16 bg-slate-100 rounded flex items-center justify-center">{i.image?<img src={i.image} className="w-full h-full object-contain"/>:"📦"}</div><div className="flex-1"><div className="font-bold">{i.name}</div><div>{i.quantity}개</div></div><button onClick={()=>{const n=[...cart];n.splice(idx,1);setCart(n)}}><Icon name="X" className="w-4 h-4"/></button></div>)}</div><button onClick={()=>{if(cart.length>0) setIsOrderModalOpen(true)}} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold mt-4">주문하기</button></div></div>}
            
            {isOrderModalOpen && <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"><div className="bg-white w-full max-w-sm rounded-2xl p-6 relative"><button onClick={()=>setIsOrderModalOpen(false)} className="absolute top-4 right-4"><Icon name="X"/></button><h3 className="font-bold text-lg mb-4">입금 정보 확인</h3><div className="bg-blue-50 p-4 rounded mb-4"><div className="font-bold">{BANK_INFO.bankName} {BANK_INFO.accountNumber}</div><div>{BANK_INFO.holder}</div></div><input className="w-full border p-2 rounded mb-4" placeholder="입금자명" value={depositor} onChange={e=>setDepositor(e.target.value)}/><div className="flex justify-between font-bold mb-4"><span>총액</span><span>{formatPrice(cart.reduce((a,c)=>a+c.price*c.quantity,0))}원</span></div><button onClick={handleFinalOrder} className="w-full bg-slate-800 text-white py-3 rounded font-bold">주문 완료</button></div></div>}
            
            {showMyPage && <MyPage user={user} onClose={()=>setShowMyPage(false)} />}
        </div>
    );
};

// ----------------------------------------------------
// [7] 메인 앱
// ----------------------------------------------------
const App = () => {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminViewMode, setAdminViewMode] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [firebaseReady, setFirebaseReady] = useState(false);

    useEffect(() => {
        const checkFirebase = () => { if (window.fb && window.auth && window.db) setFirebaseReady(true); else requestAnimationFrame(checkFirebase); };
        checkFirebase();
    }, []);

    useEffect(() => {
        if (!firebaseReady) return;
        const unsub = window.fb.onSnapshot(window.fb.collection(window.db, "products_final_v5"), (s) => setProducts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
        const authUnsub = window.fb.onAuthStateChanged(window.auth, async (u) => {
            if (u) {
                if(user && user.uid === u.uid) { setLoading(false); return; }
                try {
                    const d = await window.fb.getDoc(window.fb.doc(window.db, "users", u.uid));
                    if (d.exists()) { const ud = d.data(); setUser({ ...u, ...ud }); setIsAdmin(ud.isAdmin === true); } else { setUser(u); setIsAdmin(false); }
                } catch (e) { setUser(u); }
            } else { setUser(null); setIsAdmin(false); }
            setLoading(false);
        });
        return () => { unsub(); authUnsub(); };
    }, [firebaseReady]);

    const handleForceAdmin = () => { setIsAdmin(true); setUser({ email: 'admin@sj.com', storeName: '관리자(임시)' }); };
    const handleImmediateLogin = (u) => { setUser(u); setIsAdmin(false); setLoading(false); };
    const handleLogout = () => { setIsAdmin(false); setAdminViewMode(false); setUser(null); window.fb.logOut(window.auth); };

    if (!firebaseReady || loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">시스템 연결중...</div>;
    if (isAdmin && adminViewMode) return <AdminPage onLogout={handleLogout} onToShop={() => setAdminViewMode(false)} />;
    if (user) return <ShopPage products={products} user={user} onLogout={handleLogout} isAdmin={isAdmin} onToAdmin={() => setAdminViewMode(true)} />;
    return <LoginPage onAdminLogin={handleForceAdmin} onImmediateLogin={handleImmediateLogin} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
