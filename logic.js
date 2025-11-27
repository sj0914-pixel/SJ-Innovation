/* logic.js */
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// [0] 전역 상수 및 유틸리티
// ----------------------------------------------------
const useLucide = () => { 
    useEffect(() => { 
        if (window.lucide) window.lucide.createIcons(); 
    }); 
};

// 복구용 샘플 데이터
const INITIAL_PRODUCTS = [
    { id: "p1", name: "올인원 교정젓가락풀세트 (오로라핑)", category: "주방/식기", price: 13900, originPrice: 17500, image: "🥢", description: "오로라핑 캐릭터 교정 젓가락 풀세트.", stock: 200, minQty: 20, cartonQty: 20, rating: "4.8" },
    { id: "p2", name: "올인원 교정젓가락풀세트 (빛나핑)", category: "주방/식기", price: 13900, originPrice: 17500, image: "🥢", description: "빛나핑 캐릭터 교정 젓가락 풀세트.", stock: 200, minQty: 20, cartonQty: 20, rating: "4.7" },
    { id: "p3", name: "슈팅스타 캐치티니핑 하츄핑 모자목도리", category: "유아동의류", price: 16900, originPrice: 29900, image: "🧢", description: "하츄핑 캐릭터 모자/목도리 일체형.", stock: 100, minQty: 20, cartonQty: 20, rating: "4.9" },
    { id: "p4", name: "슈팅스타 캐치티니핑 하츄핑 벙어리장갑", category: "유아동의류", price: 22900, originPrice: 32900, image: "🧤", description: "따뜻한 하츄핑 벙어리 장갑.", stock: 100, minQty: 20, cartonQty: 20, rating: "5.0" },
    { id: "p5", name: "캐치티니핑 시즌6 미스터리 뱃지 1팩", category: "완구/교구", price: 8900, originPrice: 12900, image: "🌟", description: "랜덤 미스터리 뱃지 1팩.", stock: 200, minQty: 10, cartonQty: 10, rating: "4.5" },
    { id: "p6", name: "브레인롯 랜덤딱지 1박스", category: "완구/교구", price: 22900, originPrice: 39900, image: "🎲", description: "대유행 브레인롯 랜덤 딱지 1박스.", stock: 200, minQty: 10, cartonQty: 10, rating: "4.8" },
    { id: "p7", name: "젠바디 코로나 자가진단 키트", category: "생활/건강", price: 9350, originPrice: 13500, image: "🩺", description: "빠르고 정확한 자가진단 키트.", stock: 500, minQty: 20, cartonQty: 20, rating: "4.9" },
    { id: "p8", name: "참존 마스크", category: "생활/건강", price: 10900, originPrice: 20000, image: "😷", description: "편안한 호흡 참존 마스크.", stock: 500, minQty: 16, cartonQty: 16, rating: "4.7" }
];

const CATEGORIES = ["전체", "유아동의류", "완구/교구", "주방/식기", "생활/건강"];

const Icon = ({ name, ...props }) => {
    const iconName = name.charAt(0).toLowerCase() + name.slice(1);
    return <i data-lucide={iconName} {...props}></i>;
};

const formatPrice = (price) => new Intl.NumberFormat('ko-KR').format(price);

// ----------------------------------------------------
// [1] 공통 컴포넌트
// ----------------------------------------------------
const ImageUploader = ({ label, onImageSelect, currentImage }) => {
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(currentImage || "");
    const [isCompressing, setIsCompressing] = useState(false);

    useEffect(() => { setPreview(currentImage); }, [currentImage]);

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    const MAX_WIDTH = 800; 
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
                    resolve(dataUrl);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFile = async (file) => {
        if (!file) return;
        setIsCompressing(true);
        try {
            if (file.size < 700 * 1024) {
                const reader = new FileReader();
                reader.onloadend = () => { setPreview(reader.result); onImageSelect(reader.result); setIsCompressing(false); };
                reader.readAsDataURL(file);
            } else {
                const compressedDataUrl = await compressImage(file);
                if (compressedDataUrl.length > 1000000) {
                        alert("이미지 용량이 너무 큽니다 (1MB 초과).\n더 작은 이미지를 사용하거나 이미지를 잘라서 올려주세요.");
                        setPreview(""); onImageSelect("");
                } else {
                    setPreview(compressedDataUrl);
                    onImageSelect(compressedDataUrl);
                }
                setIsCompressing(false);
            }
        } catch (e) { alert("이미지 처리 중 오류가 발생했습니다."); setIsCompressing(false); }
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        if (confirm("이미지를 삭제하시겠습니까?")) {
            setPreview("");
            onImageSelect("");
        }
    };

    return (
        <div className="mb-4">
            <label className="block mb-1 font-bold text-sm text-slate-700">{label}</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center h-32 cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden bg-white group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current.click()}>
                {isCompressing ? (
                    <div className="flex flex-col items-center justify-center text-indigo-600"><Icon name="Loader2" className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">이미지 최적화 중...</span></div>
                ) : (
                    preview && !preview.includes("📦") ? ( 
                        <div className="relative w-full h-full">
                            <img src={preview} className="absolute inset-0 w-full h-full object-contain bg-slate-50" />
                            <button onClick={handleDelete} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md z-10" title="이미지 삭제"><Icon name="X" className="w-4 h-4" /></button>
                        </div>
                    ) : ( <div className="text-center p-4"><div className="mx-auto bg-black text-white w-10 h-10 rounded-lg flex items-center justify-center mb-2"><Icon name="UploadCloud" className="w-6 h-6" /></div><p className="text-sm text-slate-500 font-medium">클릭/드래그 업로드</p></div> )
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFile(e.target.files[0])} />
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [2] 마이페이지 (추천인 표시)
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
        if(!confirm("주문을 취소하시겠습니까?")) return;
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
                                            <span className="font-bold">송장번호: {order.trackingNumber}</span>
                                        </div>
                                    )}
                                    <div className="space-y-1 mb-3 text-sm">
                                        {order.items.map((item, i) => (
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
// [3] 관리자 페이지 (엑셀 다운로드/업로드 추가됨)
// ----------------------------------------------------
const AdminPage = ({ onLogout, onToShop }) => {
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [tab, setTab] = useState("orders");
    const [orderSubTab, setOrderSubTab] = useState("new");
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [thumbImage, setThumbImage] = useState("");
    const [detailImage, setDetailImage] = useState("");
    const excelInputRef = useRef(null);
    useLucide();

    useEffect(() => {
        if(!window.fb) return;
        const { collection, query, orderBy, onSnapshot } = window.fb;
        const unsubProd = onSnapshot(collection(window.db, "products_final_v5"), (snap) => setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubUser = onSnapshot(collection(window.db, "users"), (snap) => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubOrder = onSnapshot(collection(window.db, "orders"), (snap) => {
            let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            
            // 주문번호 생성 및 정렬
            const orderGroups = {};
            list.forEach(o => {
                const dateKey = new Date(o.date).toISOString().slice(0,10).replace(/-/g,""); 
                if(!orderGroups[dateKey]) orderGroups[dateKey] = [];
                orderGroups[dateKey].push(o);
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

    const handleLoadInitialData = async () => {
        if(!confirm("상품 목록이 비어있을 때만 사용하는 기능입니다.\n샘플 데이터를 복구하시겠습니까?")) return;
        try {
            const { doc, setDoc } = window.fb;
            await Promise.all(INITIAL_PRODUCTS.map(p => setDoc(doc(window.db, "products_final_v5", p.id), p)));
            alert("복구 완료!");
        } catch(e) { alert("오류: " + e.message); }
    };

    const handleDeleteUser = async (id) => { if(confirm("삭제?")) try { await window.fb.deleteDoc(window.fb.doc(window.db, "users", id)); } catch(e) { alert(e.message); }};

    const handleDispatch = async (id) => {
        const trackingInput = document.getElementById(`track-${id}`);
        const trackingNum = trackingInput ? trackingInput.value : "";
        if(!trackingNum) { alert("송장번호를 입력해주세요."); return; }
        if(!confirm(`송장번호 [${trackingNum}]으로 발송 처리하시겠습니까?`)) return;
        try { 
            await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { 
                status: "배송중",
                trackingNumber: trackingNum
            });
            alert("발송 처리되었습니다.");
        } catch(e) { alert("실패: " + e.message); }
    };

    const handleComplete = async (id) => {
        if(!confirm("배송 완료 처리하시겠습니까?")) return;
        try { await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), { status: "배송완료" }); } catch(e) { alert("실패"); }
    };

    // --- 엑셀 관련 기능 시작 ---
    const handleExcelDownload = () => {
        if(!window.XLSX) { alert("엑셀 라이브러리가 로드되지 않았습니다. 새로고침 해주세요."); return; }
        
        // 다운로드할 대상: '접수대기' 상태인 신규 주문
        const targetOrders = orders.filter(o => o.status === '접수대기');
        if(targetOrders.length === 0) { alert("다운로드할 신규 주문이 없습니다."); return; }

        const excelData = targetOrders.map(o => {
            const u = getUserInfo(o.userId);
            // 상품 내역을 문자열 하나로 묶음
            const itemsStr = o.items.map(i => `${i.name}(${i.quantity})`).join(", ");
            
            return {
                "시스템ID": o.id, // 나중에 업로드할 때 식별용 (필수)
                "주문번호": o.orderNo,
                "주문일시": new Date(o.date).toLocaleString(),
                "주문자명": u.storeName || o.userName,
                "연락처": u.mobile || "",
                "주소": u.address || "",
                "상품내역": itemsStr,
                "총금액": o.totalAmount,
                "송장번호": "" // 여기에 입력해서 업로드하라고 비워둠
            };
        });

        const ws = window.XLSX.utils.json_to_sheet(excelData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "신규주문");
        window.XLSX.writeFile(wb, `신규주문발주서_${new Date().toISOString().slice(0,10)}.xlsx`);
    };

    const handleExcelUpload = async (e) => {
        if(!window.XLSX) { alert("엑셀 라이브러리 로드 오류"); return; }
        const file = e.target.files[0];
        if(!file) return;

        if(!confirm("엑셀 파일을 업로드하여 송장번호를 일괄 등록하시겠습니까?\n'시스템ID'와 '송장번호' 컬럼이 있어야 합니다.")) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const rows = window.XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
                
                let successCount = 0;
                
                // 일괄 업데이트
                for (let row of rows) {
                    const docId = row["시스템ID"];
                    const trackNum = row["송장번호"];

                    if(docId && trackNum) {
                        // DB 업데이트 (status -> 배송중, trackingNumber 등록)
                        await window.fb.updateDoc(window.fb.doc(window.db, "orders", docId), {
                            status: "배송중",
                            trackingNumber: String(trackNum) // 숫자일 수 있으니 문자열로 변환
                        });
                        successCount++;
                    }
                }
                alert(`총 ${successCount}건의 송장이 등록되었습니다.`);
                e.target.value = ""; // 초기화
            } catch(err) {
                alert("엑셀 처리 중 오류 발생: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };
    // --- 엑셀 관련 기능 끝 ---

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const form = e.target;
        const totalSize = (thumbImage?.length || 0) + (detailImage?.length || 0);
        if (totalSize > 1200000) { alert("이미지 용량 합계가 저장 한도를 초과합니다."); return; }
        const newProd = {
            name: form.pName.value, category: form.pCategory.value, price: Number(form.pPrice.value), originPrice: Number(form.pOriginPrice.value),
            stock: Number(form.pStock.value), minQty: Number(form.pMinQty.value), cartonQty: Number(form.pCartonQty.value),
            image: thumbImage || "📦", detailImage: detailImage || "", description: form.pDescription.value, rating: "5.0"
        };
        try {
            if (editingProduct) { await window.fb.updateDoc(window.fb.doc(window.db, "products_final_v5", editingProduct.id), newProd); alert("수정됨"); } 
            else { await window.fb.addDoc(window.fb.collection(window.db, "products_final_v5"), newProd); alert("등록됨"); }
            setIsProductModalOpen(false);
            setEditingProduct(null);
        } catch (err) { alert("저장 오류: " + err.message); }
    };

    const handleDeleteProduct = async (id) => { if(confirm("삭제?")) try { await window.fb.deleteDoc(window.fb.doc(window.db, "products_final_v5", id)); } catch(e) { alert("실패"); }};
    
    const openAddModal = () => { setEditingProduct(null); setThumbImage(""); setDetailImage(""); setIsProductModalOpen(true); };
    const openEditModal = (prod) => { setEditingProduct(prod); setThumbImage(prod.image); setDetailImage(prod.detailImage); setIsProductModalOpen(true); };
    const getUserInfo = (uid) => users.find(u => u.id === uid) || {};

    const filteredOrders = orders.filter(o => {
        if (orderSubTab === 'new') return o.status === '접수대기';
        if (orderSubTab === 'shipping') return o.status === '배송중' || o.status === '배송완료';
        if (orderSubTab === 'cancel') return o.status === '주문취소';
        return true;
    });

    return (
        <div className="min-h-screen bg-slate-100">
            <nav className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
                <div className="flex items-center gap-2"><span className="bg-red-500 text-xs px-2 py-1 rounded font-bold">ADMIN</span><span className="font-bold text-lg">SJ 관리자</span></div>
                <div className="flex gap-2">
                    <button onClick={onToShop} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Icon name="Store" className="w-4 h-4"/>쇼핑몰 보기</button>
                    <button onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm">로그아웃</button>
                </div>
            </nav>
            <div className="max-w-7xl mx-auto p-4">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {["orders", "users", "products"].map(t => ( <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 rounded-full font-bold uppercase ${tab===t?"bg-slate-800 text-white":"bg-white text-slate-600 shadow-sm"}`}>{t}</button> ))}
                </div>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 overflow-x-auto min-h-[500px]">
                    {tab === "orders" && (
                        <div>
                            <div className="flex flex-col md:flex-row border-b bg-slate-50 justify-between items-center pr-2">
                                <div className="flex w-full md:w-auto">
                                    <button onClick={()=>setOrderSubTab("new")} className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm ${orderSubTab==="new"?"bg-white border-t-2 border-indigo-500 text-indigo-600":"text-slate-500 hover:text-slate-700"}`}>📦 신규 주문 (접수대기)</button>
                                    <button onClick={()=>setOrderSubTab("shipping")} className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm ${orderSubTab==="shipping"?"bg-white border-t-2 border-indigo-500 text-indigo-600":"text-slate-500 hover:text-slate-700"}`}>🚚 배송 관리 (배송중/완료)</button>
                                    <button onClick={()=>setOrderSubTab("cancel")} className={`flex-1 md:flex-none px-6 py-3 font-bold text-sm ${orderSubTab==="cancel"?"bg-white border-t-2 border-red-500 text-red-600":"text-slate-500 hover:text-slate-700"}`}>🚫 취소 내역</button>
                                </div>
                                <div className="flex gap-2 p-2">
                                    <button onClick={handleExcelDownload} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Icon name="Download" className="w-3 h-3"/> 주문서 엑셀 다운</button>
                                    <button onClick={()=>excelInputRef.current.click()} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1"><Icon name="Upload" className="w-3 h-3"/> 송장 일괄 등록</button>
                                    <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload} />
                                </div>
                            </div>

                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-100 uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="p-4">주문번호</th><th className="p-4">주문자 정보</th><th className="p-4">주문 내역</th><th className="p-4">총 금액</th><th className="p-4">관리 / 상태</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-slate-400">내역이 없습니다.</td></tr>
                                    ) : filteredOrders.map(o => {
                                        const orderUser = getUserInfo(o.userId);
                                        return (
                                            <tr key={o.id} className="hover:bg-slate-50 align-top">
                                                <td className="p-4 font-mono font-bold text-indigo-600">{o.orderNo || "처리중"}<div className="text-xs text-slate-400 font-normal mt-1">{new Date(o.date).toLocaleString()}</div></td>
                                                <td className="p-4 cursor-pointer hover:bg-indigo-50 transition-colors group" onClick={() => setSelectedUser(orderUser)}>
                                                    <div className="flex items-center gap-1"><div className="font-bold text-base text-indigo-900 group-hover:underline">{o.userName}</div><Icon name="Search" className="w-3 h-3 text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                                                    {orderUser.storeName && <div className="text-xs text-slate-600 mt-0.5 font-bold">{orderUser.storeName}</div>}
                                                    <div className="text-xs text-slate-400 mt-0.5">{o.userEmail}</div>
                                                </td>
                                                <td className="p-4 whitespace-normal max-w-md">
                                                    <div className="space-y-1">
                                                        {o.items.map((item, i) => (
                                                            <div key={i} className="flex justify-between text-sm border-b border-slate-100 pb-1 last:border-0">
                                                                <span className="font-medium text-slate-700">{item.name}</span><span className="font-bold text-slate-900 ml-2">{item.quantity}개</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 font-bold text-lg text-indigo-600">₩{formatPrice(o.totalAmount)}</td>
                                                <td className="p-4">
                                                    {orderSubTab === 'new' && (
                                                        <div className="flex items-center gap-2">
                                                            <input id={`track-${o.id}`} type="text" placeholder="송장번호 입력" className="border rounded p-2 text-sm w-32 outline-none focus:border-indigo-500" />
                                                            <button onClick={()=>handleDispatch(o.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded font-bold text-xs">발송</button>
                                                        </div>
                                                    )}
                                                    {orderSubTab === 'shipping' && (
                                                        <div className="space-y-2">
                                                            <div className="text-sm font-bold text-blue-600 flex items-center gap-1"><Icon name="Truck" className="w-4 h-4"/> {o.status}</div>
                                                            <div className="text-xs bg-slate-100 p-1 rounded">송장: {o.trackingNumber}</div>
                                                            {o.status !== '배송완료' && <button onClick={()=>handleComplete(o.id)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold text-xs w-full">배송완료 처리</button>}
                                                        </div>
                                                    )}
                                                    {orderSubTab === 'cancel' && <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">주문취소</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {tab === "users" && (
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 uppercase font-bold text-slate-500"><tr><th className="p-4">상호명</th><th className="p-4">대표자</th><th className="p-4">이메일</th><th className="p-4">추천인</th><th className="p-4">관리</th></tr></thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u=>(<tr key={u.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{u.storeName}</td><td className="p-4">{u.repName}</td><td className="p-4">{u.email}</td><td className="p-4 text-indigo-600 font-medium">{u.recommender || "-"}</td><td className="p-4 flex gap-2"><button onClick={()=>setSelectedUser(u)} className="bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold text-xs">상세</button><button onClick={()=>handleDeleteUser(u.id)} className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold text-xs">삭제</button></td></tr>))}
                            </tbody>
                        </table>
                    )}
                    {tab === "products" && (
                        <div className="p-4">
                            <div className="flex justify-between mb-4">
                                <h3 className="font-bold text-lg">상품 목록</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleLoadInitialData} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm flex gap-1 items-center"><Icon name="RefreshCw" className="w-4 h-4"/>샘플 데이터 복구</button>
                                    <button onClick={openAddModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-bold text-sm">+ 상품 등록</button>
                                </div>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 uppercase font-bold text-slate-500"><tr><th className="p-4">이미지</th><th className="p-4">상품명</th><th className="p-4">가격</th><th className="p-4">재고</th><th className="p-4">관리</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map(p=>(
                                        <tr key={p.id} className="hover:bg-slate-50">
                                            <td className="p-4 text-2xl">{p.image && (p.image.startsWith('data:') || p.image.startsWith('http')) ? <img src={p.image} className="w-10 h-10 object-cover rounded"/> : "📦"}</td>
                                            <td className="p-4"><div className="font-bold">{p.name}</div><div className="text-xs text-slate-400">{p.category}</div></td>
                                            <td className="p-4">₩{formatPrice(p.price)}</td>
                                            <td className="p-4 font-bold text-blue-600">{p.stock}</td>
                                            <td className="p-4 flex gap-2"><button onClick={()=>openEditModal(p)} className="bg-slate-200 px-3 py-1 rounded text-xs font-bold">수정</button><button onClick={()=>handleDeleteProduct(p.id)} className="bg-red-100 text-red-500 px-3 py-1 rounded text-xs font-bold">삭제</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white p-6 rounded-xl max-w-md w-full shadow-2xl relative">
                        <button onClick={()=>setSelectedUser(null)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><Icon name="X"/></button>
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">회원 상세 정보</h3>
                        <div className="space-y-3 text-sm">
                            <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">상호명</span><span className="font-bold text-lg">{selectedUser.storeName || "미입력"}</span></div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">대표자명</span><span className="font-bold">{selectedUser.repName || "미입력"}</span></div>
                                <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">연락처</span><span className="font-bold">{selectedUser.mobile || "미입력"}</span></div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">추천인</span><span className="font-bold text-indigo-600">{selectedUser.recommender || "없음"}</span></div>
                            <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">사업자등록번호</span><span className="font-bold">{selectedUser.businessNumber || "미입력"}</span></div>
                            <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">주소</span><span className="font-bold">{selectedUser.address || "미입력"}</span></div>
                            <div className="p-3 bg-slate-50 rounded"><span className="text-slate-500 block mb-1 text-xs">이메일</span><span className="font-bold">{selectedUser.email || "미입력"}</span></div>
                        </div>
                    </div>
                </div>
            )}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white p-6 rounded-xl max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={()=>setIsProductModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"><Icon name="X"/></button>
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">{editingProduct ? "상품 수정" : "상품 등록"}</h3>
                        <form onSubmit={handleSaveProduct} className="space-y-3 text-sm">
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
                            <ImageUploader label="상세페이지 이미지 (선택)" currentImage={detailImage} onImageSelect={setDetailImage} />
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
// [4] 로그인 페이지 (추천인 추가됨)
// ----------------------------------------------------
const LoginPage = ({ onAdminLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isAddrOpen, setIsAddrOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const addrWrapRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '', name: '', mobile: '', email: '', zipcode: '', address: '', addressDetail: '', businessType: '문구/팬시점', storeName: '', repName: '', businessNumber: '', businessCategory: '', businessItem: '', taxEmail: '', recommender: '' });
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

        if(isLoginMode && formData.username === 'sj' && formData.password === '0914') {
            onAdminLogin(); return;
        }

        try {
            if(isLoginMode) {
                const persistence = rememberMe ? window.fb.browserLocalPersistence : window.fb.browserSessionPersistence;
                await window.fb.setPersistence(window.auth, persistence);
                await window.fb.signInUser(window.auth, formData.username, formData.password);
            } else {
                if(formData.password !== formData.confirmPassword) { alert("비밀번호 불일치"); setLoading(false); return; }
                const cred = await window.fb.createUser(window.auth, formData.email, formData.password);
                await window.fb.setDoc(window.fb.doc(window.db, "users", cred.user.uid), {
                    email: formData.email, displayId: formData.username, name: formData.name, mobile: formData.mobile,
                    address: `${formData.address} ${formData.addressDetail}`, businessType: formData.businessType,
                    storeName: formData.storeName, repName: formData.repName, businessNumber: formData.businessNumber,
                    businessCategory: formData.businessCategory, businessItem: formData.businessItem, taxEmail: formData.taxEmail,
                    recommender: formData.recommender, // 추천인 저장
                    joinedAt: new Date().toISOString(), status: "승인대기", isAdmin: false
                });
                alert("가입 완료! 자동 로그인됩니다.");
            }
        } catch(err) { alert("오류: " + err.message); setLoading(false); }
    };
    const handleChange = (e) => setFormData(prev=>({...prev, [e.target.name]: e.target.value}));

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
            <div className={`bg-white rounded-2xl shadow-xl w-full mx-auto transition-all duration-300 ${isLoginMode?'max-w-md p-8':'max-w-3xl p-8'}`}>
                <div className="text-center mb-8"><div className="bg-slate-800 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">S</div><h1 className="text-2xl font-bold text-slate-800">{isLoginMode?"SJ 파트너 로그인":"사업자 회원등록"}</h1><p className="text-slate-500 mt-2 text-sm">SJ Innovation</p></div>
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
                                    <div><label className="block text-sm font-bold mb-1">이름</label><input name="name" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">아이디(표시용)</label><input name="username" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">비밀번호</label><input name="password" type="password" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">비밀번호 확인</label><input name="confirmPassword" type="password" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">연락처</label><input name="mobile" className="w-full p-2 border rounded" onChange={handleChange} required /></div>
                                    <div><label className="block text-sm font-bold mb-1">이메일(로그인용)</label><input name="email" className="w-full p-2 border rounded" onChange={handleChange} required placeholder="example@naver.com" /></div>
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
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold mt-6 transition-all duration-300 shadow-lg">{loading?"처리중...":(isLoginMode?"로그인하기":"회원가입 완료")}</button>
                </form>
                <div className="mt-6 text-center text-sm"><button onClick={()=>setIsLoginMode(!isLoginMode)} className="underline font-bold text-slate-600 hover:text-slate-900 transition-colors">{isLoginMode?"사업자 회원가입":"로그인하기"}</button></div>
            </div>
            {isAddrOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all duration-300"><div className="bg-white w-full max-w-lg h-[500px] rounded-xl overflow-hidden relative shadow-2xl flex flex-col"><div className="p-3 border-b flex justify-between font-bold bg-slate-50"><span>주소 검색</span><button onClick={()=>setIsAddrOpen(false)} className="hover:bg-slate-100 p-2 rounded-full"><Icon name="X"/></button></div><div ref={addrWrapRef} className="flex-1 w-full bg-slate-100 relative"></div></div></div>}
        </div>
    );
};

// ----------------------------------------------------
// [5] 상세 페이지 (ShopPage 밖으로 분리됨)
// ----------------------------------------------------
const ProductDetail = ({ product, onBack, onAddToCart, goHome }) => {
    const [qty, setQty] = useState(product.minQty || 1);
    useLucide();
    
    const handleQuantityChange = (delta) => {
        const min = product.minQty || 1;
        const max = (product.cartonQty || 1) * 5;
        const newQuantity = qty + delta;
        if (delta > 0) { if (newQuantity <= max) setQty(newQuantity); else alert(`최대 발주 수량은 ${max}개(5박스)입니다.`); } 
        else { if (newQuantity >= min) setQty(newQuantity); else alert(`최소 주문 수량은 ${min}개입니다.`); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white animate-in slide-in-from-right duration-300 min-h-screen flex flex-col pb-[80px]">
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><Icon name="ArrowLeft" className="w-7 h-7 text-slate-800" /></button>
                <div className="flex-1 flex justify-center"><div className="font-bold text-lg bg-slate-800 text-white px-3 py-1 rounded cursor-pointer" onClick={goHome}>SJ Innovation</div></div>
                <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><Icon name="X" className="w-6 h-6 text-slate-600" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-slate-50 aspect-square w-full flex items-center justify-center mb-6 overflow-hidden">
                        {product.image.startsWith('data:') || product.image.startsWith('.') || product.image.startsWith('http') ? <img src={product.image} alt={product.name} className="w-full h-full object-contain" /> : <span className="text-[8rem] drop-shadow-2xl">{product.image}</span>}
                    </div>
                    <div className="px-5 pb-8">
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
                    <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1"><button onClick={()=>handleQuantityChange(-1)} className="w-9 h-9 bg-white rounded shadow-sm flex items-center justify-center transition-all"><Icon name="Minus" className="w-4 h-4"/></button><span className="font-bold w-8 text-center">{qty}</span><button onClick={()=>handleQuantityChange(1)} className="w-9 h-9 bg-white rounded shadow-sm flex items-center justify-center transition-all"><Icon name="Plus" className="w-4 h-4"/></button></div>
                    <button onClick={()=>{onAddToCart(product,qty); onBack();}} className="flex-1 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-slate-900"><Icon name="ShoppingBag" className="w-4 h-4" /> 담기</button>
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
    const [selectedCategory, setSelectedCategory] = useState("전체");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showMyPage, setShowMyPage] = useState(false);
    useLucide();

    const goHome = () => { setSelectedCategory("전체"); setSearchTerm(""); setSelectedProduct(null); setShowMyPage(false); window.scrollTo(0, 0); };
    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const idx = prev.findIndex(item => item.id === product.id);
            if (idx > -1) { const newCart = [...prev]; newCart[idx].quantity += quantity; return newCart; }
            return [...prev, { ...product, quantity }];
        });
        alert("장바구니에 추가되었습니다.");
    };
    const handlePlaceOrder = async () => {
        if(cart.length === 0) return;
        if(!confirm("총 " + formatPrice(cart.reduce((a,c)=>a+c.price*c.quantity,0)) + "원 발주하시겠습니까?")) return;
        try {
            const uid = window.auth.currentUser ? window.auth.currentUser.uid : "admin_manual";
            await window.fb.addDoc(window.fb.collection(window.db, "orders"), {
                userId: uid, userEmail: user.email, userName: user.storeName || "미등록상점",
                items: cart, totalAmount: cart.reduce((a,c)=>a+c.price*c.quantity,0), date: new Date().toISOString(), status: "접수대기"
            });
            alert("발주가 접수되었습니다."); setCart([]); setIsCartOpen(false);
        } catch(e) { alert("실패: " + e.message); }
    };
    const filteredProducts = products.filter(p => {
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

    // 상세 페이지 렌더링 분기
    if (selectedProduct) return <ProductDetail product={selectedProduct} onBack={handleClose} onAddToCart={addToCart} goHome={goHome} />;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-80" onClick={goHome}>
                        <div className="bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                        <div className="flex flex-col"><span className="font-bold text-lg leading-none hidden sm:block">SJ Innovation</span></div>
                    </div>
                    <div className="flex-1 max-w-lg mx-4 relative hidden sm:block">
                        <input type="text" placeholder="상품 검색..." className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                        <Icon name="Search" className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-4">
                        {isAdmin && (
                            <button onClick={onToAdmin} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-md transition-all flex items-center gap-1"><Icon name="Settings" className="w-3 h-3"/>관리자</button>
                        )}
                        <button onClick={openCart} className="relative p-2 hover:bg-slate-100 rounded-full transition-all"><Icon name="Boxes" className="w-6 h-6" />{cart.length>0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{cart.length}</span>}</button>
                        <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
                        <button onClick={openMyPage} className="flex items-center gap-2 text-sm font-medium hover:bg-slate-100 p-2 rounded-full transition-all"><div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center"><Icon name="User" className="w-4 h-4" /></div><span className="hidden sm:block">{user.storeName || "내 정보"}</span></button>
                        <button onClick={onLogout} className="bg-slate-200 hover:bg-red-500 hover:text-white px-3 py-1 rounded font-bold text-sm transition-all duration-300">로그아웃</button>
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 py-8 transition-all duration-300">
                <div className="bg-slate-900 rounded-2xl p-8 mb-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
                    <div><span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold mb-3 inline-block border border-white/30">SJ Innovation 파트너</span><h2 className="text-3xl font-bold mb-2">겨울 시즌 신상 입고!</h2><p className="text-slate-300">티니핑 시즌5 굿즈 & 방한 용품 대량 입고.</p></div>
                    <div className="flex gap-3"><div className="bg-white/10 p-4 rounded-xl text-center min-w-[100px]"><div className="text-2xl font-bold">NEW</div><div className="text-xs text-slate-300">신규 캐릭터</div></div><div className="bg-white/10 p-4 rounded-xl text-center min-w-[100px]"><div className="text-2xl font-bold">40%</div><div className="text-xs text-slate-300">추가 할인</div></div></div>
                </div>
                <div className="flex overflow-x-auto pb-4 gap-2 mb-4 scrollbar-hide">
                    {CATEGORIES.map(cat => ( <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap border transition-all duration-300 ${selectedCategory === cat ? "bg-slate-800 text-white" : "bg-white hover:bg-slate-50"}`}>{cat}</button> ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredProducts.map(p => (
                        <div key={p.id} onClick={() => openProduct(p)} className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group overflow-hidden flex flex-col">
                            <div className="aspect-[4/3] bg-slate-100 relative flex items-center justify-center overflow-hidden">
                                {p.image.startsWith('data:') || p.image.startsWith('http') || p.image.startsWith('.') ? <img src={p.image} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" /> : <span className="text-6xl transform group-hover:scale-110 transition-transform duration-500">{p.image}</span>}
                                <div className="absolute top-3 left-3 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">인기</div>
                            </div>
                            <div className="p-5 flex flex-col flex-grow">
                                <div className="text-xs text-slate-400 mb-1 font-medium">{p.category}</div>
                                <h3 className="font-bold text-slate-800 mb-2 text-lg leading-tight line-clamp-2">{p.name}</h3>
                                <div className="flex items-center gap-1 mb-4"><Icon name="Star" className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="text-sm font-bold text-slate-700">{p.rating || "5.0"}</span></div>
                                <div className="mt-auto">
                                    <div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-400">권장가</span><span className="text-xs text-slate-400 line-through">₩{formatPrice(p.originPrice)}</span></div>
                                    <div className="flex justify-between items-baseline mb-3"><span className="text-sm font-bold text-slate-700">공급가</span><span className="text-xl font-bold text-slate-800">₩{formatPrice(p.price)}</span></div>
                                    <button className="w-full bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-slate-800 group-hover:text-white py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"><Icon name="Search" className="w-4 h-4" /> 상세</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            {isCartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end transition-all duration-300">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose}></div>
                    <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col p-5 animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-4 border-b pb-4"><h2 className="font-bold text-lg">발주 목록 ({cart.length})</h2><button onClick={handleClose} className="hover:bg-slate-100 p-2 rounded-full"><Icon name="X" /></button></div>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex gap-4 border-b pb-4 items-center">
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl overflow-hidden">
                                        {item.image.startsWith('data:') || item.image.startsWith('http') ? <img src={item.image} className="w-full h-full object-contain"/> : item.image}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium line-clamp-1">{item.name}</h4>
                                        <div className="flex justify-between mt-1 text-sm"><span className="bg-slate-100 px-2 rounded">수량: {item.quantity}</span><span className="font-bold">₩{formatPrice(item.price * item.quantity)}</span></div>
                                    </div>
                                    <button onClick={()=>{const nc=[...cart]; nc.splice(idx,1); setCart(nc);}} className="text-slate-400 hover:text-red-500 transition-colors duration-150"><Icon name="X" className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                        {cart.length>0 && <div className="border-t pt-4"><div className="flex justify-between mb-4"><span className="text-slate-600">총 공급가액</span><span className="font-bold text-xl">₩{formatPrice(cart.reduce((a,c)=>a+c.price*c.quantity,0))}</span></div><button onClick={handlePlaceOrder} className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold shadow-lg flex justify-center items-center gap-2 transition-all hover:bg-slate-900"><Icon name="Truck" className="w-5 h-5" />발주 신청하기</button></div>}
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

    // 1. Firebase 로드 대기 (Race Condition 해결)
    useEffect(() => {
        const interval = setInterval(() => {
            if (window.fb && window.auth && window.db) {
                console.log("React: Firebase is ready");
                setFirebaseReady(true);
                clearInterval(interval);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // 2. Firebase 준비 후 데이터 구독
    useEffect(() => {
        if (!firebaseReady) return;

        const { collection, onSnapshot, getDoc, doc } = window.fb;
        
        // 상품 목록 구독
        const unsub = onSnapshot(collection(window.db, "products_final_v5"), (snap) => {
            setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        
        // 인증 상태 구독
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
            }
            setLoading(false);
        });
        return () => { unsub(); authUnsub(); };
    }, [firebaseReady]);

    const handleForceAdmin = () => {
        setIsAdmin(true);
        setUser({ email: 'admin@sj.com', storeName: '관리자(임시)' });
    };

    const handleLogout = () => {
        setIsAdmin(false);
        setAdminViewMode(false);
        setUser(null);
        window.fb.logOut(window.auth);
    };

    if (!firebaseReady || loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">시스템 연결중...</div>;
    
    if (isAdmin && adminViewMode) {
        return <AdminPage onLogout={handleLogout} onToShop={() => setAdminViewMode(false)} />;
    }
    
    if (user) {
        return <ShopPage products={products} user={user} onLogout={handleLogout} isAdmin={isAdmin} onToAdmin={() => setAdminViewMode(true)} />;
    }

    return <LoginPage onAdminLogin={handleForceAdmin} />;
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
