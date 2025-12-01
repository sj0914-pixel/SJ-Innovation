/* logic.js - Mobile Header Layout Fixed */
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// [0] 전역 상수 및 유틸리티
// ----------------------------------------------------

// 기본 배너
const DEFAULT_BANNERS = {
    top: "", 
    middle: "" 
};

// 택배사 목록
const COURIERS = ["CJ대한통운", "우체국택배", "한진택배", "로젠택배", "롯데택배", "직접전달", "화물배송"];

// 계좌 정보 (카카오뱅크)
const BANK_INFO = {
    bankName: "카카오뱅크",
    accountNumber: "3333-34-0785028",
    holder: "에스제이이노베이션"
};

const CATEGORIES = ["전체", "유아동의류", "완구/교구", "주방/식기", "생활/건강"];

// ----------------------------------------------------
// 아이콘 컴포넌트 (이모지 버전)
// ----------------------------------------------------
const Icon = ({ name, className, ...props }) => {
    // 이모지 매핑표 - LogOut 아이콘 추가됨
    const iconMap = {
        Search: "🔍", X: "✕", Menu: "☰", RefreshCw: "↻", Loader2: "⌛", Settings: "⚙️",
        ShoppingBag: "🛍️", Store: "🏪", Truck: "🚚", Package: "📦", Boxes: "📚", CreditCard: "💳",
        User: "👤", ArrowLeft: "←", ChevronRight: "〉", Plus: "➕", Minus: "➖", Star: "⭐",
        Image: "🖼️", Upload: "⬆️", Download: "⬇️", LayoutTemplate: "📄", AlertCircle: "!",
        Box: "□", Edit: "✏️", Trash: "🗑️", LogOut: "🚪"
    };

    const displayIcon = iconMap[name] || name || "?";

    return (
        <span 
            className={className} 
            style={{ display: 'inline-block', fontStyle: 'normal', lineHeight: '1', textAlign: 'center' }} 
            {...props}
        >
            {displayIcon}
        </span>
    );
};

const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price);

const formatDate = (dateInput) => {
    try {
        if (!dateInput) return "";
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return ""; 
        const offset = d.getTimezoneOffset() * 60000;
        const dateOffset = new Date(d.getTime() - offset);
        return dateOffset.toISOString().slice(0, 10);
    } catch (e) { return ""; }
};

// ----------------------------------------------------
// [1] 공통 컴포넌트 (이미지 업로더)
// ----------------------------------------------------
const ImageUploader = ({ label, onImageSelect, currentImage }) => {
    const fileInputRef = useRef(null);
    const [isCompressing, setIsCompressing] = useState(false);

    const displayImage = (typeof currentImage === 'string') ? currentImage : "";

    const compressImageToJPG = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 1200; 
                    if (width > MAX_WIDTH) { 
                        height *= MAX_WIDTH / width; 
                        width = MAX_WIDTH; 
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                    resolve(dataUrl);
                };
                img.onerror = reject;
                img.src = event.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFile = async (file) => {
        if (!file) return;
        setIsCompressing(true);
        setTimeout(async () => {
            try {
                if (file.size < 300 * 1024) { 
                    const reader = new FileReader();
                    reader.onloadend = () => { 
                        if(reader.result) onImageSelect(reader.result); 
                        setIsCompressing(false); 
                    };
                    reader.readAsDataURL(file);
                } else {
                    const compressedDataUrl = await compressImageToJPG(file);
                    if (compressedDataUrl.length > 3000000) { 
                        alert("이미지 용량이 너무 큽니다.");
                        onImageSelect("");
                    } else {
                        onImageSelect(compressedDataUrl);
                    }
                    setIsCompressing(false);
                }
            } catch (e) { 
                console.error(e);
                alert("이미지 처리 오류"); 
                setIsCompressing(false); 
            }
        }, 50);
    };

    return (
        <div className="mb-4">
            <label className="block mb-1 font-bold text-sm text-slate-700">{label}</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center h-32 cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden bg-white group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current.click()}>
                
                {isCompressing ? (
                    <div className="text-indigo-600 font-bold text-xs flex flex-col items-center">
                        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span>업로드 중...</span>
                    </div>
                ) : (
                    displayImage && !displayImage.includes("📦") ? ( 
                        <div className="relative w-full h-full">
                            <img src={displayImage} className="absolute inset-0 w-full h-full object-cover bg-slate-50" alt="preview" />
                            <button onClick={(e)=>{e.stopPropagation(); if(confirm("삭제하시겠습니까?")) onImageSelect("");}} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10 shadow-sm"><Icon name="X" className="w-4 h-4" /></button>
                        </div>
                    ) : ( 
                        <div className="text-center p-4">
                            <Icon name="Image" className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">클릭하여 업로드</p>
                            <span className="text-[10px] text-blue-400 mt-1 block">JPG 자동 변환</span>
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
        if(!confirm("주문을 취소하시겠습니까?")) return;
        try { await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { status: "주문취소" }); } catch(e) { alert("실패"); }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 transition-all safe-area-bottom">
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
                            <div className="p-3 bg-slate-50 rounded"><div className="text-slate-400 mb-1">추천인</div><div className="font-bold text-indigo-600">{user.recommender || "없음"}</div></div>
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
                                    {order.trackingNumber && (
                                        <div className="bg-indigo-50 p-2 mb-3 rounded flex items-center gap-2 text-sm text-indigo-800">
                                            <Icon name="Truck" className="w-4 h-4"/>
                                            <span className="font-bold">송장번호: {order.trackingNumber} ({order.courier || "택배"})</span>
                                        </div>
                                    )}
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
    const [tab, setTab] = useState("orders");
    
    // 배너 State
    const [topBanner, setTopBanner] = useState("");
    const [middleBanner, setMiddleBanner] = useState("");
    
    // 배너 불러오기
    useEffect(() => {
        if(window.fb && window.fb.getDoc) {
            window.fb.getDoc(window.fb.doc(window.db, "config", "banners")).then(d => {
                if(d.exists()) {
                    const data = d.data();
                    setTopBanner(data.top || "");
                    setMiddleBanner(data.middle || "");
                }
            }).catch(e => console.log("배너 없음"));
        }
    }, []);
    
    const getTodayStr = () => formatDate(new Date());
    const [searchInputs, setSearchInputs] = useState({ status: "전체", dateType: "오늘", startDate: getTodayStr(), endDate: getTodayStr(), searchType: "주문자명", keyword: "" });
    const [appliedFilters, setAppliedFilters] = useState({ status: "전체", dateType: "오늘", startDate: getTodayStr(), endDate: getTodayStr(), searchType: "주문자명", keyword: "" });

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [thumbImage, setThumbImage] = useState("");
    const [detailImage, setDetailImage] = useState("");
    
    const excelInputRef = useRef(null);

    useEffect(() => {
        if(!window.fb) return;
        const { collection, onSnapshot, doc, getDocs } = window.fb;
        const unsubProd = onSnapshot(collection(window.db, "products_final_v5"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        // 회원 목록 실시간
        const unsubUser = onSnapshot(collection(window.db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        
        const unsubOrder = onSnapshot(collection(window.db, "orders"), (snap) => {
            let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            const orderGroups = {};
            list.forEach(o => {
                if(o.date) {
                    const dateKey = new Date(o.date).toISOString().slice(0,10).replace(/-/g,""); 
                    if(!orderGroups[dateKey]) orderGroups[dateKey] = [];
                    orderGroups[dateKey].push(o);
                }
            });
            Object.keys(orderGroups).forEach(dateKey => {
                orderGroups[dateKey].sort((a,b) => new Date(a.date) - new Date(b.date));
                orderGroups[dateKey].forEach((o, idx) => {
                    o.orderNo = `${dateKey}-${String(idx+1).padStart(2,'0')}`;
                });
            });
            list.sort((a,b) => new Date(b.date) - new Date(a.date));
            setOrders(list);
        });

        return () => { unsubProd(); unsubUser(); unsubOrder(); };
    }, []);

    const getUserInfo = (uid) => users.find(u => u.id === uid) || {};

    const filteredOrders = orders.filter(o => {
        if (appliedFilters.status !== "전체" && o.status !== appliedFilters.status) return false;
        if (appliedFilters.keyword) {
            const u = getUserInfo(o.userId);
            const keyword = appliedFilters.keyword.toLowerCase();
            let target = "";
            if (appliedFilters.searchType === "주문자명") target = `${o.userName} ${u.storeName || ""} ${u.repName || ""}`;
            else if (appliedFilters.searchType === "주문번호") target = o.orderNo || "";
            if (!target.toLowerCase().includes(keyword)) return false;
        }
        if (appliedFilters.startDate && appliedFilters.endDate) {
            const orderDate = formatDate(new Date(o.date));
            if (orderDate < appliedFilters.startDate || orderDate > appliedFilters.endDate) return false;
        }
        return true;
    });

    const countStatus = (status) => orders.filter(o => o.status === status).length;

    const handleSearch = () => { setAppliedFilters({ ...searchInputs }); setSelectedIds(new Set()); };
    const handleReset = () => {
        const resetState = { status: "전체", dateType: "전체", startDate: "", endDate: "", searchType: "주문자명", keyword: "" };
        setSearchInputs(resetState); setAppliedFilters(resetState); setSelectedIds(new Set());
    };
    
    const handleDateBtn = (type) => {
        const today = new Date();
        let start = new Date();
        if (type === "오늘") { } 
        else if (type === "7일") { start.setDate(today.getDate() - 7); } 
        else if (type === "30일") { start.setDate(today.getDate() - 30); }
        setSearchInputs(prev => ({ 
            ...prev, dateType: type, startDate: type === "전체" ? "" : formatDate(start), endDate: type === "전체" ? "" : formatDate(today) 
        }));
    };
    
    const handleCardClick = (targetStatus) => {
        let realStatus = targetStatus;
        if (targetStatus === "결제완료(신규)") realStatus = "접수대기";
        const newState = { status: realStatus, dateType: "전체", startDate: "", endDate: "", searchType: "주문자명", keyword: "" };
        setSearchInputs(newState); setAppliedFilters(newState); setSelectedIds(new Set());
    };
    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if(newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedIds(newSet);
    };
    const toggleSelectAll = (e) => {
        if(e.target.checked) setSelectedIds(new Set(filteredOrders.map(o=>o.id))); else setSelectedIds(new Set());
    };
    const handleBatchStatus = async (status) => {
        if(selectedIds.size === 0) return alert("선택된 주문이 없습니다.");
        if(!confirm(`선택한 ${selectedIds.size}건을 [${status}] 상태로 변경하시겠습니까?`)) return;
        try {
            const promises = Array.from(selectedIds).map(id => window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { status }));
            await Promise.all(promises);
            alert("처리되었습니다."); setSelectedIds(new Set());
        } catch(e) { alert("오류: " + e.message); }
    };
    const handleUpdateTracking = async (id, courier, tracking) => {
        try { await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { courier, trackingNumber: tracking, status: tracking ? "배송중" : "접수대기" }); } catch(e) { console.error(e); }
    };

    const handleExcelDownload = () => {
        if(!window.XLSX) { alert("엑셀 라이브러리 오류"); return; }
        const targetData = filteredOrders.length > 0 ? filteredOrders : orders;
        const excelData = targetData.map(o => {
            const u = getUserInfo(o.userId);
            return {
                "시스템ID": o.id, "주문번호": o.orderNo, "상태": o.status, "주문일": formatDate(o.date),
                "주문자": u.storeName || o.userName, "연락처": u.mobile, "입금자명": o.depositor || u.repName, "주소": u.address,
                "상품": (o.items || []).map(i=>`${i.name}(${i.quantity})`).join(", "), "총액": o.totalAmount,
                "택배사": o.courier || "", "송장번호": o.trackingNumber || ""
            };
        });
        const ws = window.XLSX.utils.json_to_sheet(excelData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "주문목록");
        window.XLSX.writeFile(wb, `주문목록_${new Date().toISOString().slice(0,10)}.xlsx`);
    };
    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                let cnt = 0;
                for (let row of rows) {
                    if(row["시스템ID"] && row["송장번호"]) {
                        await window.fb.updateDoc(window.fb.doc(window.db, "orders", row["시스템ID"]), {
                            status: "배송중", trackingNumber: String(row["송장번호"]), courier: row["택배사"] || "CJ대한통운"
                        });
                        cnt++;
                    }
                }
                alert(`${cnt}건 송장 등록 완료`);
            } catch(err) { alert("엑셀 오류: " + err.message); }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault(); const form = e.target;
        const newProd = { 
            name: form.pName.value, 
            category: form.pCategory.value, 
            price: Number(form.pPrice.value)||0, 
            originPrice: Number(form.pOriginPrice.value)||0, 
            stock: Number(form.pStock.value)||0, 
            minQty: Number(form.pMinQty.value)||1, 
            cartonQty: Number(form.pCartonQty.value)||1, 
            image: thumbImage || "📦", 
            detailImage: detailImage || "", 
            description: form.pDescription.value, 
            rating: "5.0",
            isHidden: form.pIsHidden.checked,
            // [수정: 품절 및 입고예정일 저장]
            isSoldOut: form.pIsSoldOut.checked,
            restockDate: form.pRestockDate.value
        };
        try { if (editingProduct) await window.fb.updateDoc(window.fb.doc(window.db, "products_final_v5", editingProduct.id), newProd); else await window.fb.addDoc(window.fb.collection(window.db, "products_final_v5"), newProd); setIsProductModalOpen(false); alert("저장됨"); } catch (err) { alert(err.message); }
    };
    const handleDeleteProduct = async (id) => { if(confirm("삭제?")) await window.fb.deleteDoc(window.fb.doc(window.db, "products_final_v5", id)); };
    const handleDeleteUser = async (id) => { if(confirm("삭제?")) await window.fb.deleteDoc(window.fb.doc(window.db, "users", id)); };
    
    const handleSaveBanners = async () => {
        try {
            await window.fb.setDoc(window.fb.doc(window.db, "config", "banners"), {
                top: topBanner,
                middle: middleBanner
            });
            alert("배너 저장 완료");
        } catch(e) {
            alert("배너 저장 실패: " + e.message);
        }
    };
    
    const handleRefreshUsers = async () => {
        try {
            if(window.fb && window.fb.getDocs) {
                const snap = await window.fb.getDocs(window.fb.collection(window.db, "users"));
                setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                alert("회원 목록 갱신 완료");
            } else {
                alert("기능 로딩중...");
            }
        } catch(e) { 
            console.error(e);
            alert("불러오기 실패: " + e.message); 
        }
    };

    const openAddModal = () => { setEditingProduct(null); setThumbImage(""); setDetailImage(""); setIsProductModalOpen(true); };
    const openEditModal = (p) => { setEditingProduct(p); setThumbImage(p.image); setDetailImage(p.detailImage); setIsProductModalOpen(true); };

    // [★모바일 추가] 관리자용 카드 뷰 컴포넌트
    const OrderCard = ({ o, u }) => (
        <div className={`bg-white p-4 rounded-xl border shadow-sm mb-3 ${selectedIds.has(o.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} className="w-5 h-5 rounded accent-blue-600" />
                    <span className="font-mono font-bold text-blue-600 cursor-pointer" onClick={()=>setSelectedUser(u)}>{o.orderNo}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-bold ${o.status==='접수대기'?'bg-blue-100 text-blue-600':o.status==='배송완료'?'bg-slate-100':'bg-green-100 text-green-700'}`}>{o.status}</span>
            </div>
            <div className="mb-2" onClick={()=>setSelectedUser(u)}>
                <div className="font-bold text-slate-800">{u.storeName || o.userName} <span className="text-slate-400 font-normal text-xs">({u.repName})</span></div>
                <div className="text-xs text-slate-500">{u.mobile} / {o.depositor ? `입금: ${o.depositor}` : "미입력"}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-2 space-y-1">
                {(o.items||[]).map((i,x)=><div key={x} className="flex justify-between"><span>{i.name}</span><span className="font-bold">{i.quantity}</span></div>)}
            </div>
            <div className="flex flex-col gap-2">
                <select className="border rounded p-1 text-xs w-full bg-white" defaultValue={o.courier} onChange={(e)=>handleUpdateTracking(o.id, e.target.value, o.trackingNumber)}>{COURIERS.map(c=><option key={c}>{c}</option>)}</select>
                <div className="flex gap-1">
                    <input className="border rounded p-1 text-xs w-full" placeholder="송장번호" defaultValue={o.trackingNumber} onBlur={(e)=>handleUpdateTracking(o.id, o.courier||"CJ대한통운", e.target.value)} />
                </div>
            </div>
            <div className="mt-2 text-right font-bold text-slate-800">{formatPrice(o.totalAmount)}원</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex items-center gap-3"><span className="bg-red-500 text-xs px-2 py-1 rounded font-bold">ADMIN</span><span className="font-bold text-lg hidden sm:inline">SJ 파트너스 관리자</span><span className="font-bold text-lg sm:hidden">SJ 관리자</span></div>
                <div className="flex gap-2">
                    <button onClick={onToShop} className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm font-bold flex gap-2 items-center"><Icon name="Store" className="w-4 h-4"/>쇼핑몰</button>
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold">로그아웃</button>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
                {/* [★모바일] 탭 버튼 스크롤 가능하도록 개선 */}
                <div className="flex gap-2 border-b border-slate-300 pb-1 overflow-x-auto whitespace-nowrap">
                    {["orders", "users", "products", "banners"].map(t => (
                        <button key={t} onClick={()=>setTab(t)} className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase transition-colors whitespace-nowrap ${tab===t ? "bg-white text-slate-900 border border-b-0 border-slate-300 shadow-sm" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}>
                            {t === 'orders' ? '주문 통합 관리' : t === 'users' ? '회원 관리' : t === 'products' ? '상품 관리' : '배너 관리'}
                        </button>
                    ))}
                </div>

                {tab === "orders" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 대시보드 - 모바일에서는 가로스크롤 대신 그리드로 보기 좋게 조정 */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: "결제완료(신규)", count: countStatus("접수대기"), color: "text-blue-600", bg: "bg-blue-50" },
                                { label: "배송준비", count: countStatus("배송준비"), color: "text-indigo-600", bg: "bg-indigo-50" },
                                { label: "배송지시", count: countStatus("배송지시"), color: "text-orange-600", bg: "bg-orange-50" },
                                { label: "배송중", count: countStatus("배송중"), color: "text-green-600", bg: "bg-green-50" },
                                { label: "배송완료", count: countStatus("배송완료"), color: "text-slate-600", bg: "bg-slate-50" }
                            ].map((card, idx) => (
                                <div key={idx} onClick={() => handleCardClick(card.label)} className={`p-5 rounded-lg border shadow-sm flex flex-col justify-between h-28 ${card.bg} cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-slate-200`}>
                                    <div className="text-sm font-bold text-slate-500 flex items-center gap-1">{card.label} <Icon name="ChevronRight" className="w-3 h-3 text-slate-400"/></div>
                                    <div className={`text-3xl font-bold ${card.color}`}>{card.count} <span className="text-base text-slate-400 font-normal">건</span></div>
                                </div>
                            ))}
                        </div>

                        {/* 필터 */}
                        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <span className="w-20 font-bold text-sm text-slate-600">기간</span>
                                {/* [★모바일] 버튼 그룹 줄바꿈 방지 */}
                                <div className="flex gap-1 overflow-x-auto">
                                    {["오늘","7일","30일","전체"].map(d => ( <button key={d} onClick={()=>handleDateBtn(d)} className={`px-3 py-1.5 border rounded text-xs font-bold whitespace-nowrap ${searchInputs.dateType===d ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 hover:bg-slate-50"}`}>{d}</button> ))}
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input type="date" className="border rounded px-2 py-1 text-sm text-slate-500 w-full md:w-auto" value={searchInputs.startDate} onChange={(e)=>setSearchInputs({...searchInputs, startDate: e.target.value})} />
                                    <span className="text-slate-400 self-center">~</span>
                                    <input type="date" className="border rounded px-2 py-1 text-sm text-slate-500 w-full md:w-auto" value={searchInputs.endDate} onChange={(e)=>setSearchInputs({...searchInputs, endDate: e.target.value})} />
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <span className="w-20 font-bold text-sm text-slate-600">배송상태</span>
                                <div className="flex gap-4 flex-wrap">
                                    {["전체", "접수대기", "배송준비", "배송중", "배송완료", "주문취소"].map(s => (
                                        <label key={s} className="flex items-center gap-2 cursor-pointer text-sm">
                                            <input type="radio" name="status" checked={searchInputs.status === s} onChange={()=>setSearchInputs({...searchInputs, status: s})} className="accent-blue-600" /> 
                                            {s === "접수대기" ? "결제완료(신규)" : s}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center border-t pt-4">
                                <span className="w-20 font-bold text-sm text-slate-600">상세조건</span>
                                <select className="border rounded px-2 py-2 text-sm bg-slate-50 min-w-[120px] w-full md:w-auto" value={searchInputs.searchType} onChange={(e)=>setSearchInputs({...searchInputs, searchType: e.target.value})}>
                                    <option value="주문자명">주문자명</option><option value="주문번호">주문번호</option>
                                </select>
                                <input className="border rounded px-3 py-2 text-sm w-full md:w-96" placeholder="검색어 입력" value={searchInputs.keyword} onChange={(e)=>setSearchInputs({...searchInputs, keyword: e.target.value})} onKeyDown={(e)=>{if(e.key==='Enter') handleSearch()}} />
                                <div className="ml-auto flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                                    <button onClick={handleReset} className="px-4 py-2 border rounded text-sm font-bold hover:bg-slate-50 flex-1 md:flex-none">초기화</button>
                                    <button onClick={handleSearch} className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm flex-1 md:flex-none">검색</button>
                                </div>
                            </div>
                        </div>

                        {/* 리스트 */}
                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50/50">
                                <div className="flex gap-2 items-center flex-wrap">
                                    <span className="font-bold text-sm mr-2">{selectedIds.size}개 선택됨</span>
                                    <button onClick={()=>handleBatchStatus("배송준비")} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"><Icon name="Package" className="w-3 h-3"/> 배송준비</button>
                                    <button onClick={()=>handleBatchStatus("배송중")} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"><Icon name="Truck" className="w-3 h-3"/> 배송중 처리</button>
                                    <button onClick={()=>handleBatchStatus("주문취소")} className="bg-white border text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50">취소 처리</button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExcelDownload} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"><Icon name="Download" className="w-3 h-3"/> 엑셀 다운</button>
                                    <button onClick={()=>excelInputRef.current.click()} className="bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800 flex items-center gap-1"><Icon name="Upload" className="w-3 h-3"/> 송장 일괄 등록</button>
                                    <input type="file" ref={excelInputRef} className="hidden" onChange={handleExcelUpload} />
                                </div>
                            </div>
                            
                            {/* [★모바일] 모바일에서는 Card View, 데스크탑에서는 Table View */}
                            <div className="md:hidden p-2 bg-slate-100">
                                {filteredOrders.length === 0 ? <div className="text-center text-slate-400 py-10">검색된 주문이 없습니다.</div> :
                                filteredOrders.map(o => <OrderCard key={o.id} o={o} u={getUserInfo(o.userId)} />)}
                            </div>

                            <div className="hidden md:block overflow-x-auto min-h-[400px]">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-100 text-slate-500 font-bold border-b text-xs uppercase">
                                        <tr>
                                            <th className="p-3 w-10 text-center"><input type="checkbox" onChange={toggleSelectAll} /></th>
                                            <th className="p-3">주문번호</th>
                                            <th className="p-3">택배사</th>
                                            <th className="p-3">송장번호</th>
                                            <th className="p-3">배송상태</th>
                                            <th className="p-3">주문일시</th>
                                            <th className="p-3">주문자/수취인</th>
                                            <th className="p-3">상품명/옵션/수량</th>
                                            <th className="p-3">총금액</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length === 0 ? <tr><td colSpan="9" className="p-10 text-center text-slate-400">검색된 주문이 없습니다.</td></tr> :
                                        filteredOrders.map(o => {
                                            const u = getUserInfo(o.userId);
                                            return (
                                                <tr key={o.id} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.has(o.id) ? "bg-blue-50" : ""}`}>
                                                    <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.has(o.id)} onChange={()=>toggleSelect(o.id)} /></td>
                                                    <td className="p-3 font-mono text-blue-600 font-bold cursor-pointer hover:underline" onClick={()=>setSelectedUser(u)}>{o.orderNo}</td>
                                                    <td className="p-3">
                                                        <select className="border rounded px-2 py-1 text-xs bg-white w-24" defaultValue={o.courier || "CJ대한통운"} onChange={(e)=>handleUpdateTracking(o.id, e.target.value, o.trackingNumber)}>
                                                            {COURIERS.map(c=><option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td className="p-3">
                                                        <input type="text" className="border rounded px-2 py-1 text-xs w-32 focus:border-blue-500 outline-none" placeholder="송장번호 입력" defaultValue={o.trackingNumber || ""} 
                                                            onBlur={(e)=>handleUpdateTracking(o.id, o.courier||"CJ대한통운", e.target.value)} 
                                                            onKeyDown={(e)=>{if(e.key==='Enter') e.target.blur()}}
                                                        />
                                                    </td>
                                                    <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-bold ${o.status==='접수대기'?'bg-blue-100 text-blue-700':o.status==='배송준비'?'bg-indigo-100 text-indigo-700':o.status==='배송중'?'bg-green-100 text-green-700':o.status==='주문취소'?'bg-red-100 text-red-700':'bg-slate-100 text-slate-600'}`}>{o.status === '접수대기' ? '결제완료' : o.status}</span></td>
                                                    <td className="p-3 text-slate-500 text-xs">{new Date(o.date).toLocaleString()}</td>
                                                    <td className="p-3">
                                                        <div className="font-bold">{u.storeName || o.userName}</div>
                                                        <div className="text-xs text-slate-400">{u.mobile}</div>
                                                        {o.depositor && <div className="text-xs text-indigo-600 font-bold">입금: {o.depositor}</div>}
                                                    </td>
                                                    <td className="p-3 max-w-xs whitespace-normal">
                                                        <div className="text-xs text-slate-600 leading-tight">
                                                            {(o.items||[]).map((i,idx)=>(<div key={idx} className="mb-1"><span className="text-blue-600 font-bold">[{i.name}]</span> {i.quantity}개</div>))}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 font-bold text-slate-700">{formatPrice(o.totalAmount)}원</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {tab === "users" && (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <span className="font-bold text-slate-600">총 회원수: {users.length}명</span>
                            <button onClick={handleRefreshUsers} className="bg-slate-800 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-900 flex gap-1 items-center"><Icon name="RefreshCw" className="w-3 h-3"/>목록 새로고침</button>
                        </div>
                        
                        {/* [★모바일] 회원관리 모바일 뷰 */}
                        <div className="md:hidden">
                            {users.map(u => (
                                <div key={u.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                                    <div onClick={()=>setSelectedUser(u)}>
                                        <div className="font-bold">{u.storeName} <span className="text-sm font-normal text-slate-500">{u.repName}</span></div>
                                        <div className="text-xs text-slate-400">{u.mobile}</div>
                                        <div className="text-xs text-slate-500">{u.email}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={()=>setSelectedUser(u)} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">상세</button>
                                        <button onClick={()=>handleDeleteUser(u.id)} className="bg-red-50 text-red-500 px-2 py-1 rounded text-xs font-bold">삭제</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-100 uppercase font-bold text-slate-500"><tr><th className="p-4">상호명</th><th className="p-4">대표자</th><th className="p-4">이메일</th><th className="p-4">추천인</th><th className="p-4">관리</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.map(u=>(<tr key={u.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{u.storeName}</td><td className="p-4">{u.repName}</td><td className="p-4">{u.email}</td><td className="p-4 text-indigo-600 font-medium">{u.recommender || "-"}</td><td className="p-4 flex gap-2"><button onClick={()=>setSelectedUser(u)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold text-xs">상세</button><button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-xs">삭제</button></td></tr>))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {tab === "products" && (
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-lg">상품 목록</h3>
                            <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold text-sm">+ 상품 등록</button>
                        </div>
                        
                        {/* [★모바일] 상품관리 카드 리스트 뷰 */}
                        <div className="md:hidden grid grid-cols-1 gap-3">
                            {products.map(p => (
                                <div key={p.id} className={`bg-white p-4 rounded-xl border flex gap-3 ${p.isHidden?"opacity-60 bg-slate-100":""}`}>
                                    <div className="w-20 h-20 bg-slate-50 rounded flex items-center justify-center overflow-hidden border">
                                        {p.image.includes("data") || p.image.includes("http") ? <img src={p.image} className="w-full h-full object-cover"/> : <span className="text-2xl">📦</span>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold line-clamp-1">{p.name}</div>
                                        <div className="text-xs text-slate-500 mb-1">{p.category} | 재고 {p.stock}</div>
                                        <div className="font-bold text-slate-800">{formatPrice(p.price)}원</div>
                                        {p.isSoldOut && <div className="text-xs text-red-500 font-bold mt-1">품절 (입고: {p.restockDate})</div>}
                                    </div>
                                    <div className="flex flex-col gap-2 justify-center">
                                        <button onClick={()=>openEditModal(p)} className="bg-slate-100 p-2 rounded text-slate-600"><Icon name="Edit" className="w-4 h-4" /></button>
                                        <button onClick={()=>handleDeleteProduct(p.id)} className="bg-red-50 p-2 rounded text-red-500"><Icon name="Trash" className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="p-4">이미지</th>
                                        <th className="p-4">상품명</th>
                                        <th className="p-4">가격</th>
                                        <th className="p-4">재고</th>
                                        <th className="p-4">상태</th>
                                        <th className="p-4">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map(p=>(
                                        <tr key={p.id} className={`hover:bg-slate-50 ${p.isHidden ? "bg-slate-100 opacity-60" : ""}`}>
                                            <td className="p-4 text-2xl">{p.image && (p.image.startsWith('data:') || p.image.startsWith('http')) ? <img src={p.image} className="w-10 h-10 object-cover rounded"/> : "📦"}</td>
                                            <td className="p-4">
                                                <div className="font-bold">{p.name}</div>
                                                <div className="text-xs text-slate-400">{p.category}</div>
                                                {p.isSoldOut && <div className="text-xs text-red-500 font-bold mt-1">※ 일시품절 처리됨</div>}
                                            </td>
                                            <td className="p-4">₩{formatPrice(p.price)}</td>
                                            <td className="p-4 font-bold text-blue-600">{p.stock}</td>
                                            <td className="p-4">{p.isHidden ? <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">판매중지</span> : <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-bold">판매중</span>}</td>
                                            <td className="p-4 flex gap-2"><button onClick={()=>openEditModal(p)} className="bg-slate-200 px-3 py-1 rounded text-xs font-bold">수정</button><button onClick={()=>handleDeleteProduct(p.id)} className="bg-red-100 text-red-500 px-3 py-1 rounded text-xs font-bold">삭제</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
            {/* 회원 상세 팝업 */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 safe-area-bottom">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                        <button onClick={()=>setSelectedUser(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><Icon name="X"/></button>
                        <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Icon name="User" className="w-6 h-6"/> 회원 상세 정보</h3>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 text-sm">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-500 mb-3 text-xs uppercase tracking-wider">기본 정보</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><div className="text-slate-400 text-xs mb-1">이름</div><div className="font-bold">{selectedUser.name}</div></div>
                                    <div><div className="text-slate-400 text-xs mb-1">연락처</div><div className="font-bold">{selectedUser.mobile}</div></div>
                                    <div className="col-span-2"><div className="text-slate-400 text-xs mb-1">이메일</div><div className="font-bold">{selectedUser.email}</div></div>
                                    <div className="col-span-2"><div className="text-slate-400 text-xs mb-1">주소</div><div className="font-bold">{selectedUser.address}</div></div>
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <h4 className="font-bold text-slate-500 mb-3 text-xs uppercase tracking-wider">사업자 정보</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><div className="text-slate-400 text-xs mb-1">상호명</div><div className="font-bold">{selectedUser.storeName}</div></div>
                                    <div><div className="text-slate-400 text-xs mb-1">대표자</div><div className="font-bold">{selectedUser.repName}</div></div>
                                    <div><div className="text-slate-400 text-xs mb-1">사업자번호</div><div className="font-bold">{selectedUser.businessNumber}</div></div>
                                    <div><div className="text-slate-400 text-xs mb-1">업태</div><div className="font-bold">{selectedUser.businessType}</div></div>
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="text-indigo-800 text-xs mb-1 font-bold">추천인</div>
                                <div className="font-bold text-indigo-600 text-lg">{selectedUser.recommender || "없음"}</div>
                            </div>
                            <div className="text-xs text-slate-400 text-right">가입일: {new Date(selectedUser.joinedAt).toLocaleString()}</div>
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-end">
                            <button onClick={()=>setSelectedUser(null)} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors">닫기</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 safe-area-bottom">
                    <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setIsProductModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><Icon name="X"/></button>
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">{editingProduct ? "상품 수정" : "상품 등록"}</h3>

                                <form onSubmit={handleSaveProduct} className="space-y-3 text-sm">
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-100 mb-2">
                                    <input type="checkbox" name="pIsHidden" defaultChecked={editingProduct?.isHidden} id="hiddenCheck" className="w-4 h-4 accent-red-600"/>
                                    <label htmlFor="hiddenCheck" className="text-red-700 font-bold cursor-pointer">쇼핑몰 판매 중지 (숨김 처리)</label>
                                </div>
                            
                                <div className="p-3 bg-yellow-50 rounded border border-yellow-100 mb-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" name="pIsSoldOut" defaultChecked={editingProduct?.isSoldOut} id="soldOutCheck" className="w-4 h-4 accent-yellow-600"/>
                                        <label htmlFor="soldOutCheck" className="text-yellow-700 font-bold cursor-pointer">일시 품절 처리 (상품은 보이나 구매 불가)</label>
                                    </div>
                                    <input name="pRestockDate" defaultValue={editingProduct?.restockDate} placeholder="예: 12월 15일 입고 예정 (미입력시 '일시품절'로 표시)" className="w-full border p-2 rounded bg-white text-xs"/>
                                </div>
                            
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block mb-1 font-bold">카테고리</label>
                                        <select name="pCategory" defaultValue={editingProduct?.category} className="w-full border p-2 rounded">
                                            {CATEGORIES.filter(c=>c!=="전체").map(c=><option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold">재고</label>
                                        {/* 재고 기본값 500 */}
                                        <input name="pStock" type="number" defaultValue={editingProduct?.stock || 500} className="w-full border p-2 rounded" required />
                                    </div>
                                </div>
                            
                                <div>
                                    <label className="block mb-1 font-bold">상품명</label>
                                    <input name="pName" defaultValue={editingProduct?.name} className="w-full border p-2 rounded" required />
                                </div>
                            
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block mb-1 font-bold">권장가 (소비자가)</label>
                                        {/* 권장가 입력 시 공급가(55% 할인) 자동 계산 */}
                                        <input 
                                            name="pOriginPrice" 
                                            type="number" 
                                            defaultValue={editingProduct?.originPrice} 
                                            className="w-full border p-2 rounded bg-yellow-50 focus:bg-white transition-colors" 
                                            placeholder="입력 시 공급가 자동완성"
                                            required 
                                            onChange={(e) => {
                                                const origin = Number(e.target.value);
                                                if(origin > 0) {
                                                    const priceInput = document.getElementsByName("pPrice")[0];
                                                    if(priceInput) {
                                                        priceInput.value = Math.round(origin * 0.45); 
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold">공급가 (도매가)</label>
                                        <input name="pPrice" type="number" defaultValue={editingProduct?.price} className="w-full border p-2 rounded text-blue-600 font-bold" required />
                                    </div>
                                </div>
                            
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block mb-1 font-bold">최소주문(MOQ)</label>
                                        {/* 최소주문 기본값 10 */}
                                        <input name="pMinQty" type="number" defaultValue={editingProduct?.minQty || 10} className="w-full border p-2 rounded" />
                                    </div>
                                    <div>
                                        <label className="block mb-1 font-bold">1카톤 수량</label>
                                        {/* [수정 완료] 1카톤 수량 기본값 10으로 변경 */}
                                        <input name="pCartonQty" type="number" defaultValue={editingProduct?.cartonQty || 10} className="w-full border p-2 rounded" />
                                    </div>
                                </div>
                            
                                <ImageUploader label="썸네일 이미지" currentImage={thumbImage} onImageSelect={setThumbImage} />
                                <ImageUploader label="상세페이지 이미지 (선택)" currentImage={detailImage} onImageSelect={setDetailImage} />
                                
                                <div>
                                    <label className="block mb-1 font-bold">소개 문구</label>
                                    <textarea name="pDescription" defaultValue={editingProduct?.description} className="w-full border p-2 rounded h-20"></textarea>
                                </div>
                                
                                <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-4 hover:bg-indigo-700">
                                    {editingProduct ? "수정 저장" : "신규 등록"}
                                </button>
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
const LoginPage = ({ onAdminLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isAddrOpen, setIsAddrOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const addrWrapRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', mobile: '', email: '', zipcode: '', address: '', addressDetail: '', businessType: '문구/팬시점', storeName: '', repName: '', businessNumber: '', businessCategory: '', businessItem: '', taxEmail: '', recommender: '' });

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

        if(isLoginMode && formData.username === 'sj' && formData.password === '0914') {
             try {
                await window.fb.signInUser(window.auth, "admin@sj.com", "sjmaster0914");
            } catch(e) {
                try {
                    const cred = await window.fb.createUser(window.auth, "admin@sj.com", "sjmaster0914");
                    await window.fb.setDoc(window.fb.doc(window.db, "users", cred.user.uid), {
                        email: "admin@sj.com", storeName: "총괄관리자", repName: "SJ",
                        isAdmin: true, role: "master", joinedAt: new Date().toISOString()
                    });
                    alert("관리자 계정 생성됨");
                } catch(createErr) {
                    alert("관리자 접속 오류: " + createErr.message);
                }
            }
            return;
        }

        try {
            if(isLoginMode) {
                const persistence = rememberMe ? window.fb.browserLocalPersistence : window.fb.browserSessionPersistence;
                await window.fb.setPersistence(window.auth, persistence);
                await window.fb.signInUser(window.auth, formData.username, formData.password);
            } else {
                const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
                if(!pwRegex.test(formData.password)) {
                    alert("비밀번호는 영문과 숫자를 모두 포함하여 8자리 이상이어야 합니다.");
                    setLoading(false);
                    return;
                }

                if(formData.password !== formData.confirmPassword) { alert("비밀번호가 일치하지 않습니다."); setLoading(false); return; }
                
                const cred = await window.fb.createUser(window.auth, formData.email, formData.password);
                await window.fb.setDoc(window.fb.doc(window.db, "users", cred.user.uid), {
                    email: formData.email, displayId: formData.email.split('@')[0], name: formData.name, mobile: formData.mobile,
                    address: `${formData.address} ${formData.addressDetail}`, businessType: formData.businessType,
                    storeName: formData.storeName, repName: formData.repName, businessNumber: formData.businessNumber,
                    businessCategory: formData.businessCategory, businessItem: formData.businessItem, taxEmail: formData.taxEmail,
                    recommender: formData.recommender,
                    joinedAt: new Date().toISOString(), status: "승인대기", isAdmin: false
                });
            }
        } catch(err) { 
            alert("오류: " + err.message); 
            setLoading(false); 
        }
    };
    const handleChange = (e) => setFormData(prev=>({...prev, [e.target.name]: e.target.value}));

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8 safe-area-pb">
            <div className={`bg-white rounded-2xl shadow-xl w-full mx-auto transition-all duration-300 ${isLoginMode?'max-w-md p-8':'max-w-3xl p-8'}`}>
                {/* 로그인 상단 로고 */}
                <div className="text-center mb-8">
                    <img src="https://i.ibb.co/LdPMppLv/image.png" alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-800">{isLoginMode?"SJ 파트너 로그인":"사업자 회원등록"}</h1>
                    <p className="text-slate-500 mt-2 text-sm">SJ Innovation</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isLoginMode ? (
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1 text-slate-700">아이디 (이메일)</label><input name="username" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all" onChange={handleChange} required placeholder="example@naver.com" /></div>
                            <div><label className="block text-sm font-bold mb-1 text-slate-700">비밀번호</label><input name="password" type="password" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none transition-all" onChange={handleChange} required /></div>
                            <div className="flex items-center gap-2"><input type="checkbox" id="remember" className="w-4 h-4 accent-slate-800" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} /><label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">로그인 정보 기억하기</label></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="font-bold mb-4 border-b border-slate-200 pb-2 text-slate-700">필수정보 <span className="text-red-500">*</span></h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold mb-1">이메일(로그인용 ID)</label><input name="email" className="w-full p-2 border rounded" onChange={handleChange} required placeholder="example@naver.com" /></div>
                                    <div><label className="block text-sm font-bold mb-1">이름</label><input name="name" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">비밀번호</label><input name="password" type="password" className="w-full p-2 border rounded" onChange={handleChange} required placeholder="영문, 숫자 포함 8자리 이상" /></div>
                                    <div><label className="block text-sm font-bold mb-1">비밀번호 확인</label><input name="confirmPassword" type="password" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">연락처</label><input name="mobile" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                </div>
                                <div className="mt-4"><label className="block text-sm font-bold mb-1">주소</label><div className="flex gap-2 mb-2"><input value={formData.zipcode} readOnly className="w-24 p-2 border bg-slate-100 rounded" /><button type="button" onClick={()=>setIsAddrOpen(true)} className="bg-slate-600 text-white px-3 rounded text-sm hover:bg-slate-700 transition-colors">주소검색</button></div><input value={formData.address} readOnly className="w-full p-2 border bg-slate-100 rounded mb-2" /><input name="addressDetail" className="w-full p-2 border rounded" placeholder="상세주소" onChange={handleChange} /></div>
                                <div className="mt-4 pt-4 border-t border-slate-200">
                                    <label className="block text-sm font-bold mb-1 text-indigo-900">추천인</label>
                                    <p className="text-xs text-slate-500 mb-2">귀하에게 이 쇼핑몰 입점을 제안하거나 안내해준 영업 담당자의 이름을 입력해주세요.</p>
                                    <input name="recommender" className="w-full p-2 border border-indigo-200 bg-indigo-50 rounded placeholder-slate-400 focus:bg-white transition-colors" placeholder="예: 김철수 과장" onChange={handleChange} />
                                </div>
                            </section>
                            <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="font-bold mb-4 border-b border-slate-200 pb-2 text-slate-700">사업자 정보 <span className="text-red-500">*</span></h3>
                                <div className="mb-4"><label className="block text-sm font-bold mb-2">사업 형태</label><div className="grid grid-cols-3 gap-3">{['문구/팬시점','과자/아이스크림','편의점','키즈카페','기타'].map(t=><label key={t} className="flex items-center gap-2 text-sm border p-2 rounded bg-white cursor-pointer transition-colors"><input type="radio" name="businessType" value={t} checked={formData.businessType===t} onChange={handleChange} />{t}</label>)}</div></div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold mb-1">상호명</label><input name="storeName" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">대표자명</label><input name="repName" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div className="md:col-span-2"><label className="block text-sm font-bold mb-1">사업자번호</label><input name="businessNumber" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                </div>
                            </section>
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold mt-6 transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
                        {loading && <Icon name="Loader2" className="w-5 h-5 animate-spin" />}
                        {loading ? "처리중..." : (isLoginMode ? "로그인하기" : "회원가입 완료")}
                    </button>
                </form>
                <div className="mt-6 text-center text-sm"><button onClick={()=>setIsLoginMode(!isLoginMode)} className="underline font-bold text-slate-600 hover:text-slate-900 transition-colors">{isLoginMode?"사업자 회원가입":"로그인하기"}</button></div>
            </div>
            {isAddrOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all duration-300"><div className="bg-white w-full max-w-lg h-[500px] rounded-xl overflow-hidden relative shadow-2xl flex flex-col"><div className="p-3 border-b flex justify-between font-bold bg-slate-50"><span>주소 검색</span><button onClick={()=>setIsAddrOpen(false)} className="hover:bg-slate-100 p-2 rounded-full"><Icon name="X"/></button></div><div ref={addrWrapRef} className="flex-1 w-full bg-slate-100 relative"></div></div></div>}
        </div>
    );
};

// ----------------------------------------------------
// [5] 상세 페이지
// ----------------------------------------------------
const ProductDetail = ({ product, onBack, onAddToCart, goHome }) => {
    const [qty, setQty] = useState(product.minQty || 1);
    
    const handleQuantityChange = (delta) => {
        const min = product.minQty || 1;
        const max = (product.cartonQty || 1) * 5;
        const newQuantity = qty + delta;
        if (delta > 0) { if (newQuantity <= max) setQty(newQuantity); else alert(`최대 발주 수량은 ${max}개(5박스)입니다.`); } 
        else { if (newQuantity >= min) setQty(newQuantity); else alert(`최소 주문 수량은 ${min}개입니다.`); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-right duration-300 min-h-screen flex flex-col pb-[80px] safe-area-pb">
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><Icon name="ArrowLeft" className="w-7 h-7 text-slate-800" /></button>
                
                {/* 상세페이지 상단 로고 */}
                <div className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-80" onClick={goHome}>
                    <img src="https://i.ibb.co/LdPMppLv/image.png" alt="SJ Innovation" className="h-9 w-auto object-contain" />
                </div>
                
                <button onClick={goHome} className="p-2 hover:bg-slate-100 rounded-full transition-all"><Icon name="Store" className="w-6 h-6 text-slate-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-slate-50 aspect-square w-full flex items-center justify-center mb-6 overflow-hidden">
                        {product.image.startsWith('data:') || product.image.startsWith('.') || product.image.startsWith('http') ? <img src={product.image} alt={product.name} className="w-full h-full object-contain" /> : <span className="text-[8rem] drop-shadow-2xl">{product.image}</span>}
                    </div>
                    <div className="px-5 pb-8">
                        <div className="mb-4">
                            <span className="text-sm text-slate-500 font-bold block mb-1">{product.category}</span>
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">{product.name}</h1>
                        </div>
                        <div className="flex items-end gap-3 mb-6 pb-6 border-b border-slate-100"><span className="text-2xl sm:text-3xl font-bold text-slate-900">₩{formatPrice(product.price)}</span><span className="text-base sm:text-lg text-slate-400 line-through mb-1">₩{formatPrice(product.originPrice)}</span><span className="text-xs sm:text-sm text-red-500 font-bold mb-1 ml-auto bg-red-50 px-2 py-1 rounded">{Math.round((1-product.price/product.originPrice)*100)}% OFF</span></div>
                        <div className="bg-indigo-50 text-indigo-900 px-4 py-3 rounded-lg mb-8 flex items-start gap-3 border border-indigo-100"><Icon name="AlertCircle" className="w-5 h-5 mt-0.5 flex-shrink-0 text-indigo-600" /><div><span className="font-bold block text-sm">최소 {product.minQty}개 발주 가능 (1카톤 = {product.cartonQty}개)</span><span className="text-xs text-indigo-700 mt-1 block">도매 전용 상품 (카톤 단위 출고)</span><span className="text-xs text-red-600 font-bold mt-1 block">최대 5박스 한정 (대량 발주는 개별 문의)</span></div></div>
                        <div className="space-y-8">
                            <div><h3 className="text-lg font-bold text-slate-900 mb-3">상품 설명</h3><p className="text-slate-600 leading-relaxed text-sm bg-slate-50 p-5 rounded-xl border border-slate-100">{product.description}</p></div>
                            {product.detailImage && <div><h3 className="text-lg font-bold text-slate-900 mb-3">상세 정보</h3><img src={product.detailImage} className="w-full rounded-xl" /></div>}
                            <div><h3 className="text-lg font-bold text-slate-900 mb-3">배송 정보</h3><div className="bg-slate-50 p-5 rounded-xl space-y-3 text-sm text-slate-600 border border-slate-100"><div className="flex gap-3 items-center"><Icon name="Truck" className="w-5 h-5 text-slate-400" /><span>평일 14시 이전 주문 시 당일 출고</span></div><div className="flex gap-3 items-center"><Icon name="Boxes" className="w-5 h-5 text-slate-400" /><span>박스 단위 발주 가능</span></div></div></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 sm:p-4 shadow z-30 safe-area-bottom transition-all duration-300">
                <div className="max-w-3xl mx-auto flex gap-3">
                    {/* [수정] 품절 상태일 경우 구매 버튼 비활성화 */}
                    {product.isSoldOut ? (
                        <div className="w-full bg-slate-400 text-white font-bold rounded-xl flex flex-col items-center justify-center py-2 cursor-not-allowed">
                            <span className="text-lg">일시 품절</span>
                            <span className="text-xs text-slate-100">{product.restockDate || "빠른 시일 내에 재입고 하겠습니다."}</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1"><button onClick={()=>handleQuantityChange(-1)} className="w-9 h-9 bg-white rounded shadow-sm flex items-center justify-center transition-all"><Icon name="Minus" className="w-4 h-4"/></button><span className="font-bold w-8 text-center">{qty}</span><button onClick={()=>handleQuantityChange(1)} className="w-9 h-9 bg-white rounded shadow-sm flex items-center justify-center transition-all"><Icon name="Plus" className="w-4 h-4"/></button></div>
                            <button onClick={()=>{onAddToCart(product,qty);}} className="flex-1 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-900"><Icon name="ShoppingBag" className="w-4 h-4" /> 담기</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [6] 쇼핑몰 페이지 (ShopPage)
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
    const [banners, setBanners] = useState(DEFAULT_BANNERS);

    useEffect(() => {
        if(window.fb) {
            const { doc, onSnapshot } = window.fb;
            const unsub = onSnapshot(doc(window.db, "config", "banners"), (d) => {
                if(d.exists()) setBanners(d.data());
            });
            return () => unsub();
        }
    }, []);

    const goHome = () => { setSelectedCategory("전체"); setSearchTerm(""); setSelectedProduct(null); setShowMyPage(false); window.scrollTo(0, 0); };
    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const idx = prev.findIndex(item => item.id === product.id);
            if (idx > -1) { const newCart = [...prev]; newCart[idx].quantity += quantity; return newCart; }
            return [...prev, { ...product, quantity }];
        });
        alert("장바구니에 상품이 담겼습니다.");
    };

    const openOrderModal = () => {
        if(cart.length === 0) return;
        setDepositor(user.repName || ""); 
        setIsCartOpen(false);
        setIsOrderModalOpen(true);
    };

    const handleFinalOrder = async (e) => {
        if (!depositor.trim()) return alert("입금자명을 입력해주세요.");
        if(!confirm("주문을 완료하시겠습니까?")) return;
        try {
            const uid = window.auth.currentUser ? window.auth.currentUser.uid : "admin_manual";
            await window.fb.addDoc(window.fb.collection(window.db, "orders"), {
                userId: uid, userEmail: user.email, userName: user.storeName || "미등록상점",
                items: cart, totalAmount: cart.reduce((a,c)=>a+c.price*c.quantity,0), 
                date: new Date().toISOString(), status: "접수대기",
                paymentMethod: "무통장입금", depositor: depositor, bankInfo: BANK_INFO
            });
            alert(`[주문 완료]\n\n${BANK_INFO.bankName} ${BANK_INFO.accountNumber}\n예금주: ${BANK_INFO.holder}\n\n위 계좌로 입금 부탁드립니다.`);
            setCart([]); 
            setIsCartOpen(false);
            setIsOrderModalOpen(false);
        } catch(e) { alert("실패: " + e.message); }
    };

    const filteredProducts = products.filter(p => {
        if (p.isHidden) return false;
        const matchCat = selectedCategory === "전체" || p.category === selectedCategory;
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
    });

    const openProduct = (p) => { window.history.pushState(null,"",""); setSelectedProduct(p); };
    const openCart = () => { window.history.pushState(null,"",""); setIsCartOpen(true); };
    const openMyPage = () => { window.history.pushState(null,"",""); setShowMyPage(true); };
    
    useEffect(() => {
        const handlePopState = () => {
            if(selectedProduct) setSelectedProduct(null);
            if(isCartOpen) setIsCartOpen(false);
            if(showMyPage) setShowMyPage(false);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct, isCartOpen, showMyPage]);
    
    const handleClose = () => window.history.back();

    if (selectedProduct) return <ProductDetail product={selectedProduct} onBack={handleClose} onAddToCart={addToCart} goHome={goHome} />;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 safe-area-pb">
            {/* [★모바일] 헤더 반응형 개선: UI 깨짐 방지 */}
            <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-0 sm:h-16 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* 메인페이지 상단 로고: flex-shrink-0 적용으로 찌그러짐 방지 */}
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer transition-all hover:opacity-80" onClick={goHome}>
                        <img src="https://i.ibb.co/LdPMppLv/image.png" alt="SJ Innovation" className="h-8 w-auto object-contain" />
                    </div>

                    {/* [★모바일] 아이콘 그룹: flex-nowrap으로 겹침 방지 및 텍스트 숨김 */}
                    <div className="flex items-center gap-3 order-2 sm:order-3 ml-auto sm:ml-0 flex-nowrap flex-shrink-0">
                        {isAdmin && (
                            <button onClick={onToAdmin} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-md transition-all flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                                <Icon name="Settings" className="w-3 h-3"/>
                                <span className="hidden sm:inline">관리자</span>
                            </button>
                        )}
                        <button onClick={openCart} className="relative p-2 hover:bg-slate-100 rounded-full transition-all flex-shrink-0">
                            <span className="text-2xl">🛍️</span>
                            {cart.length>0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{cart.length}</span>}
                        </button>
                        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <button onClick={openMyPage} className="flex items-center gap-2 text-sm font-medium hover:bg-slate-100 p-2 rounded-full transition-all flex-shrink-0">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0"><Icon name="User" className="w-4 h-4" /></div>
                            <span className="hidden sm:block whitespace-nowrap">{user.storeName || "내 정보"}</span>
                        </button>
                        {/* 로그아웃 버튼: 모바일에서는 아이콘만 표시 */}
                        <button onClick={onLogout} className="bg-slate-200 hover:bg-red-500 hover:text-white px-3 py-1 rounded font-bold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                            <Icon name="LogOut" className="w-4 h-4 sm:hidden"/>
                            <span className="hidden sm:inline">로그아웃</span>
                        </button>
                    </div>

                    {/* [★모바일] 검색창: 줄바꿈하여 전체 너비 사용 */}
                    <div className="w-full sm:flex-1 sm:max-w-lg sm:mx-4 relative order-3 sm:order-2 mt-2 sm:mt-0">
                        <input type="text" placeholder="상품 검색..." className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                        <Icon name="Search" className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8 transition-all duration-300">
                {banners.top && (
                    <div className="mb-8 rounded-2xl overflow-hidden shadow-lg bg-slate-200 min-h-[160px]">
                        <img 
                            src={banners.top} 
                            alt="Top Banner" 
                            className="w-full h-auto object-cover max-h-[400px]" 
                            fetchPriority="high"
                            decoding="sync"
                        />
                    </div>
                )}

                <div className="flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide sticky top-[110px] sm:static z-30">
                    {CATEGORIES.map(cat => ( <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === cat ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-50"}`}>{cat}</button> ))}
                </div>
                
                {/* [★모바일] 그리드 간격 조정 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {filteredProducts.map((p, index) => (
                        <React.Fragment key={p.id}>
                            <div onClick={() => openProduct(p)} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col relative active:scale-95 sm:active:scale-100">
                                
                                {/* [추가] 품절 오버레이 */}
                                {p.isSoldOut && (
                                    <div className="absolute inset-0 z-10 bg-black/50 flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                                        <div className="font-bold text-xl mb-1">SOLD OUT</div>
                                        <div className="text-xs bg-black/50 px-2 py-1 rounded">{p.restockDate || "재입고 준비중"}</div>
                                    </div>
                                )}
                                
                                <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                    {p.image.startsWith('data:') || p.image.startsWith('http') || p.image.startsWith('.') ? <img src={p.image} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" /> : <span className="text-6xl transform group-hover:scale-110 transition-transform duration-500">{p.image}</span>}
                                    <div className="absolute top-3 left-3 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">인기</div>
                                </div>
                                <div className="p-3 sm:p-5 flex flex-col flex-grow">
                                    <div className="text-xs text-slate-400 mb-1 font-medium">{p.category}</div>
                                    <h3 className="font-bold text-slate-800 mb-2 text-sm sm:text-lg leading-tight line-clamp-2 min-h-[2.5em]">{p.name}</h3>
                                    <div className="flex items-center gap-1 mb-4"><Icon name="Star" className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="text-sm font-bold text-slate-700">{p.rating || "5.0"}</span></div>
                                    <div className="mt-auto">
                                        <div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-400">권장가</span><span className="text-xs text-slate-400 line-through">₩{formatPrice(p.originPrice)}</span></div>
                                        <div className="flex justify-between items-baseline mb-3"><span className="text-sm font-bold text-slate-700">공급가</span><span className="text-lg sm:text-xl font-bold text-slate-800">₩{formatPrice(p.price)}</span></div>
                                        <button className="w-full bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-slate-800 group-hover:text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"><Icon name="Search" className="w-4 h-4" /> 상세</button>
                                    </div>
                                </div>
                            </div>
                            {index === 7 && banners.middle && (
                                <div className="col-span-full my-6 rounded-2xl overflow-hidden shadow-md bg-slate-200 min-h-[128px]">
                                    <img src={banners.middle} alt="Middle Banner" className="w-full h-auto object-cover" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </main>
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-300 safe-area-bottom">
                        <div className="flex justify-between items-center mb-4 border-b pb-4"><h2 className="font-bold text-lg">발주 목록 ({cart.length})</h2><button onClick={handleClose} className="hover:bg-slate-100 p-2 rounded-full"><Icon name="X" /></button></div>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 border-b pb-4 items-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                                        {item.image.startsWith('data:') || item.image.startsWith('http') ? <img src={item.image} className="w-full h-full object-contain"/> : item.image}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium line-clamp-1">{item.name}</h4>
                                        <div className="flex justify-between mt-1 text-sm"><span className="bg-slate-100 px-2 rounded">수량: {item.quantity}</span><span className="font-bold">₩{formatPrice(item.price * item.quantity)}</span></div>
                                    </div>
                                    <button onClick={()=>{const nc=[...cart]; nc.splice(idx,1); setCart(nc);}} className="text-slate-400 hover:text-red-500 transition-colors duration-150 p-2"><Icon name="X" className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        {cart.length>0 && <div className="border-t pt-4"><div className="flex justify-between mb-4"><span className="text-slate-600">총 공급가액</span><span className="font-bold text-xl">₩{formatPrice(cart.reduce((a,c)=>a+c.price*c.quantity,0))}</span></div><button onClick={openOrderModal} className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all hover:bg-slate-900"><Icon name="Truck" className="w-5 h-5" />발주 신청하기</button></div>}
                    </div>
                </div>
            )}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 transition-all animate-in fade-in safe-area-bottom">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
                        <button onClick={()=>setIsOrderModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><Icon name="X"/></button>
                        <h3 className="text-xl font-bold mb-2">주문서 작성 및 계좌 확인</h3>
                        <p className="text-sm text-slate-500 mb-6">무통장 입금 정보를 확인해 주세요.</p>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                            <div className="text-xs text-blue-600 font-bold mb-1">입금하실 계좌</div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-slate-800">{BANK_INFO.bankName} {BANK_INFO.accountNumber}</span>
                                <button onClick={()=>{navigator.clipboard.writeText(BANK_INFO.accountNumber); alert("계좌번호가 복사되었습니다.");}} className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-blue-600 hover:bg-blue-100">복사</button>
                            </div>
                            <div className="text-sm text-slate-600">예금주: {BANK_INFO.holder}</div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-1 text-slate-700">입금자명 (필수)</label>
                            <input type="text" className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="예: 김철수 (SJ문구)" value={depositor} onChange={(e)=>setDepositor(e.target.value)} />
                            <p className="text-xs text-slate-400 mt-1">* 실제 입금하시는 분의 성함을 입력해주세요.</p>
                        </div>
                        <div className="flex justify-between items-center mb-4 pt-4 border-t">
                            <span className="text-slate-600 font-bold">총 결제금액</span>
                            <span className="text-xl font-bold text-blue-600">₩{formatPrice(cart.reduce((a,c)=>a+c.price*c.quantity,0))}</span>
                        </div>
                        <button onClick={handleFinalOrder} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 shadow-lg">입금 확인 요청 (주문 완료)</button>
                    </div>
                </div>
            )}
            {showMyPage && <MyPage user={user} onClose={handleClose} />}
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
        // 새로고침 시에도 관리자 모드 기억
        const savedAdminMode = localStorage.getItem("adminViewMode") === "true";
        if (savedAdminMode) setAdminViewMode(true);

        const interval = setInterval(() => {
            if (window.fb && window.auth && window.db) {
                setFirebaseReady(true);
                clearInterval(interval);
            }
        }, 30);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!firebaseReady) return;
        const { collection, onSnapshot, getDoc, doc } = window.fb;
        const unsub = onSnapshot(collection(window.db, "products_final_v5"), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const authUnsub = window.fb.onAuthStateChanged(window.auth, async (u) => {
            if (u) {
                try {
                    const userDoc = await getDoc(doc(window.db, "users", u.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUser({ ...u, ...userData });
                        setIsAdmin(userData.isAdmin === true);
                    } else {
                        setUser(u); setIsAdmin(false);
                    }
                } catch (e) { setUser(u); }
            } else {
                setUser(null); setIsAdmin(false);
                localStorage.removeItem("adminViewMode");
            }
            setLoading(false);
        });
        return () => { unsub(); authUnsub(); };
    }, [firebaseReady]);

    const handleForceAdmin = () => { setIsAdmin(true); setUser({ email: 'admin@sj.com', storeName: '관리자(임시)' }); };
    
    // 관리자 모드 진입/해제 시 기억하기
    const handleToAdmin = () => {
        setAdminViewMode(true);
        localStorage.setItem("adminViewMode", "true");
    };
    const handleToShop = () => {
        setAdminViewMode(false);
        localStorage.removeItem("adminViewMode");
    };
    
    const handleLogout = () => { 
        setIsAdmin(false); 
        setAdminViewMode(false); 
        setUser(null); 
        localStorage.removeItem("adminViewMode"); 
        window.fb.logOut(window.auth); 
    };

    if (!firebaseReady || loading) return (
        <div className="h-screen flex flex-col items-center justify-center font-bold text-slate-400 bg-slate-50 gap-4">
             <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
             <div>시스템 연결중...</div>
        </div>
    );
    if (isAdmin && adminViewMode) return <AdminPage onLogout={handleLogout} onToShop={handleToShop} />;
    if (user) return <ShopPage products={products} user={user} onLogout={handleLogout} isAdmin={isAdmin} onToAdmin={handleToAdmin} />;
    return <LoginPage onAdminLogin={handleForceAdmin} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
