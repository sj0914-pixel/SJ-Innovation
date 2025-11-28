/* logic.js - Final Full Version (No Truncation) */
const { useState, useEffect, useRef } = React;

// ----------------------------------------------------
// [0] 전역 상수 및 유틸리티
// ----------------------------------------------------
const useLucide = () => { 
    useEffect(() => { 
        if (window.lucide) window.lucide.createIcons(); 
    }); 
};

// 기본 배너 (관리자 미등록 시 빈칸)
const DEFAULT_BANNERS = {
    top: "", 
    middle: "" 
};

// 택배사 목록
const COURIERS = ["CJ대한통운", "우체국택배", "한진택배", "로젠택배", "롯데택배", "직접전달", "화물배송"];

// 계좌 정보 (카카오뱅크)
const BANK_INFO = {
    bankName: "카카오뱅크",
    accountNumber: "3333-24-2073558",
    holder: "에스제이이노베이션"
};

const CATEGORIES = ["전체", "유아동의류", "완구/교구", "주방/식기", "생활/건강"];

const Icon = ({ name, ...props }) => {
    const iconName = name ? name.charAt(0).toLowerCase() + name.slice(1) : 'box';
    return <i data-lucide={iconName} {...props}></i>;
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
// [1] 공통 컴포넌트 (이미지 업로더 - JPG 안전 변환)
//   ❗ 내부 구현만 단순/안정 버전으로 변경 (디자인 그대로 유지)
// ----------------------------------------------------
const ImageUploader = ({ label, onImageSelect, currentImage }) => {
    const fileInputRef = useRef(null);
    const [isCompressing, setIsCompressing] = useState(false);

    // 이미지 보여주기용 변수
    const displayImage = (typeof currentImage === 'string') ? currentImage : "";

    // 단순/안정 이미지 로더 (캔버스 변환 제거)
    const handleFile = (file) => {
        if (!file) return;
        setIsCompressing(true);

        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                onImageSelect(reader.result);
            } catch (e) {
                console.error(e);
                alert("이미지 적용 중 오류가 발생했습니다.");
            } finally {
                setIsCompressing(false);
            }
        };
        reader.onerror = () => {
            alert("이미지를 불러오지 못했습니다. 다른 이미지를 시도해주세요.");
            setIsCompressing(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="mb-4">
            <label className="block mb-1 font-bold text-sm text-slate-700">{label}</label>
            <div
                className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col justify-center items-center h-32 cursor-pointer hover:bg-slate-100 transition-colors relative overflow-hidden bg-white group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
                {isCompressing ? (
                    <div className="text-indigo-600 font-bold text-xs flex flex-col items-center">
                        <Icon name="Loader2" className="animate-spin mb-1" />
                        <span>이미지 적용 중...</span>
                    </div>
                ) : (
                    displayImage && !displayImage.includes("📦") ? (
                        <div className="relative w-full h-full">
                            <img
                                src={displayImage}
                                className="absolute inset-0 w-full h-full object-cover bg-slate-50"
                                alt="preview"
                            />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("이미지를 삭제하시겠습니까?")) onImageSelect("");
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10 shadow-sm"
                            >
                                <Icon name="X" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <Icon name="Image" className="w-5 h-5 mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 font-medium">클릭하여 업로드</p>
                            <span className="text-[10px] text-blue-400 mt-1 block">이미지가 그대로 저장됩니다.</span>
                        </div>
                    )
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                />
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
        if (!window.fb || !window.auth || !window.auth.currentUser) return;
        const { collection, query, where, onSnapshot } = window.fb;
        if (window.auth.currentUser.uid) {
            const q = query(
                collection(window.db, "orders"),
                where("userId", "==", window.auth.currentUser.uid)
            );
            const unsub = onSnapshot(q, (snap) => {
                const list = snap.docs
                    .map((d) => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                setMyOrders(list);
            });
            return () => unsub();
        }
    }, []);

    const handleCancelOrder = async (id) => {
        if (!confirm("주문을 취소하시겠습니까?")) return;
        try {
            await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), {
                status: "주문취소",
            });
        } catch (e) {
            alert("실패");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-all">
            <div className="bg-white w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-xl">마이페이지</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
                        <Icon name="X" />
                    </button>
                </div>
                <div className="flex border-b">
                    <button
                        onClick={() => setTab("info")}
                        className={`flex-1 py-3 font-bold ${
                            tab === "info"
                                ? "border-b-2 border-slate-800 text-slate-900"
                                : "text-slate-400"
                        }`}
                    >
                        내 정보
                    </button>
                    <button
                        onClick={() => setTab("orders")}
                        className={`flex-1 py-3 font-bold ${
                            tab === "orders"
                                ? "border-b-2 border-slate-800 text-slate-900"
                                : "text-slate-400"
                        }`}
                    >
                        주문 내역
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {tab === "info" ? (
                        <div className="space-y-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">상호명</div>
                                <div className="font-bold">{user.storeName}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">대표자</div>
                                <div className="font-bold">{user.repName}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">이메일</div>
                                <div className="font-bold">{user.email}</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">연락처</div>
                                <div className="font-bold">
                                    {user.mobile || "정보 없음"}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">추천인</div>
                                <div className="font-bold text-indigo-600">
                                    {user.recommender || "없음"}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded">
                                <div className="text-slate-400 mb-1">주소</div>
                                <div className="font-bold">
                                    {user.address || "정보 없음"}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {myOrders.length === 0 ? (
                                <div className="text-center text-slate-400 py-10">
                                    내역 없음
                                </div>
                            ) : (
                                myOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="border rounded-xl p-4 shadow-sm"
                                    >
                                        <div className="flex justify-between items-center mb-2 border-b pb-2">
                                            <span className="text-xs text-slate-500">
                                                {new Date(order.date).toLocaleString()}
                                            </span>
                                            <span
                                                className={`text-xs font-bold px-2 py-1 rounded ${
                                                    order.status === "접수대기"
                                                        ? "bg-blue-100 text-blue-600"
                                                        : order.status === "주문취소"
                                                        ? "bg-red-100 text-red-600"
                                                        : "bg-green-100 text-green-600"
                                                }`}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        {order.trackingNumber && (
                                            <div className="bg-indigo-50 p-2 mb-3 rounded flex items-center gap-2 text-sm text-indigo-800">
                                                <Icon
                                                    name="Truck"
                                                    className="w-4 h-4"
                                                />
                                                <span className="font-bold">
                                                    송장번호: {order.trackingNumber} (
                                                    {order.courier || "택배"})
                                                </span>
                                            </div>
                                        )}
                                        <div className="space-y-1 mb-3 text-sm">
                                            {(order.items || []).map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="flex justify-between"
                                                >
                                                    <span className="truncate w-2/3">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-slate-500">
                                                        {item.quantity}개
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t">
                                            <span className="font-bold">
                                                총 {formatPrice(order.totalAmount)}원
                                            </span>
                                            {order.status === "접수대기" && (
                                                <button
                                                    onClick={() =>
                                                        handleCancelOrder(order.id)
                                                    }
                                                    className="text-xs bg-slate-200 px-3 py-1 rounded hover:bg-slate-300"
                                                >
                                                    주문취소
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
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

    // 배너 불러오기 (한 번만 실행 - 안전장치)
    useEffect(() => {
        if (window.fb && window.fb.getDoc) {
            window.fb
                .getDoc(window.fb.doc(window.db, "config", "banners"))
                .then((d) => {
                    if (d.exists()) {
                        const data = d.data();
                        setTopBanner(data.top || "");
                        setMiddleBanner(data.middle || "");
                    }
                })
                .catch((e) => console.log("배너 없음"));
        }
    }, []);

    const getTodayStr = () => formatDate(new Date());
    const [searchInputs, setSearchInputs] = useState({
        status: "전체",
        dateType: "오늘",
        startDate: getTodayStr(),
        endDate: getTodayStr(),
        searchType: "주문자명",
        keyword: "",
    });
    const [appliedFilters, setAppliedFilters] = useState({
        status: "전체",
        dateType: "오늘",
        startDate: getTodayStr(),
        endDate: getTodayStr(),
        searchType: "주문자명",
        keyword: "",
    });

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [thumbImage, setThumbImage] = useState("");
    const [detailImage, setDetailImage] = useState("");

    const excelInputRef = useRef(null);
    useLucide();

    useEffect(() => {
        if (!window.fb) return;
        const { collection, onSnapshot } = window.fb;

        const unsubProd = onSnapshot(
            collection(window.db, "products_final_v5"),
            (snap) =>
                setProducts(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                    }))
                )
        );

        const unsubUser = onSnapshot(
            collection(window.db, "users"),
            (snap) =>
                setUsers(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                    }))
                )
        );

        const unsubOrder = onSnapshot(
            collection(window.db, "orders"),
            (snap) => {
                let list = snap.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                }));

                const orderGroups = {};
                list.forEach((o) => {
                    if (o.date) {
                        const dateKey = new Date(o.date)
                            .toISOString()
                            .slice(0, 10)
                            .replace(/-/g, "");
                        if (!orderGroups[dateKey]) orderGroups[dateKey] = [];
                        orderGroups[dateKey].push(o);
                    }
                });

                Object.keys(orderGroups).forEach((dateKey) => {
                    orderGroups[dateKey].sort(
                        (a, b) => new Date(a.date) - new Date(b.date)
                    );
                    orderGroups[dateKey].forEach((o, idx) => {
                        o.orderNo = `${dateKey}-${String(idx + 1).padStart(
                            2,
                            "0"
                        )}`;
                    });
                });

                list.sort((a, b) => new Date(b.date) - new Date(a.date));
                setOrders(list);
            }
        );

        return () => {
            unsubProd();
            unsubUser();
            unsubOrder();
        };
    }, []);

    const getUserInfo = (uid) => users.find((u) => u.id === uid) || {};

    const filteredOrders = orders.filter((o) => {
        if (appliedFilters.status !== "전체" && o.status !== appliedFilters.status)
            return false;

        if (appliedFilters.keyword) {
            const u = getUserInfo(o.userId);
            const keyword = appliedFilters.keyword.toLowerCase();
            let target = "";
            if (appliedFilters.searchType === "주문자명")
                target = `${o.userName} ${u.storeName || ""} ${
                    u.repName || ""
                }`;
            else if (appliedFilters.searchType === "주문번호")
                target = o.orderNo || "";
            if (!target.toLowerCase().includes(keyword)) return false;
        }

        if (appliedFilters.startDate && appliedFilters.endDate) {
            const orderDate = formatDate(new Date(o.date));
            if (
                orderDate < appliedFilters.startDate ||
                orderDate > appliedFilters.endDate
            )
                return false;
        }
        return true;
    });

    const countStatus = (status) => orders.filter((o) => o.status === status).length;

    const handleSearch = () => {
        setAppliedFilters({ ...searchInputs });
        setSelectedIds(new Set());
    };

    const handleReset = () => {
        const resetState = {
            status: "전체",
            dateType: "전체",
            startDate: "",
            endDate: "",
            searchType: "주문자명",
            keyword: "",
        };
        setSearchInputs(resetState);
        setAppliedFilters(resetState);
        setSelectedIds(new Set());
    };

    const handleDateBtn = (type) => {
        const today = new Date();
        let start = new Date();

        if (type === "오늘") {
        } else if (type === "7일") {
            start.setDate(today.getDate() - 7);
        } else if (type === "30일") {
            start.setDate(today.getDate() - 30);
        }

        setSearchInputs((prev) => ({
            ...prev,
            dateType: type,
            startDate: type === "전체" ? "" : formatDate(start),
            endDate: type === "전체" ? "" : formatDate(today),
        }));
    };

    const handleCardClick = (targetStatus) => {
        let realStatus = targetStatus;
        if (targetStatus === "결제완료(신규)") realStatus = "접수대기";
        const newState = {
            status: realStatus,
            dateType: "전체",
            startDate: "",
            endDate: "",
            searchType: "주문자명",
            keyword: "",
        };
        setSearchInputs(newState);
        setAppliedFilters(newState);
        setSelectedIds(new Set());
    };

    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked)
            setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
        else setSelectedIds(new Set());
    };

    const handleBatchStatus = async (status) => {
        if (selectedIds.size === 0) return alert("선택된 주문이 없습니다.");
        if (
            !confirm(
                `선택한 ${selectedIds.size}건을 [${status}] 상태로 변경하시겠습니까?`
            )
        )
            return;
        try {
            const promises = Array.from(selectedIds).map((id) =>
                window.fb.updateDoc(window.fb.doc(window.db, "orders", id), {
                    status,
                })
            );
            await Promise.all(promises);
            alert("처리되었습니다.");
            setSelectedIds(new Set());
        } catch (e) {
            alert("오류: " + e.message);
        }
    };

    const handleUpdateTracking = async (id, courier, tracking) => {
        try {
            await window.fb.updateDoc(window.fb.doc(window.db, "orders", id), {
                courier,
                trackingNumber: tracking,
                status: tracking ? "배송중" : "접수대기",
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleExcelDownload = () => {
        if (!window.XLSX) {
            alert("엑셀 라이브러리 오류");
            return;
        }
        const targetData =
            filteredOrders.length > 0 ? filteredOrders : orders;
        const excelData = targetData.map((o) => {
            const u = getUserInfo(o.userId);
            return {
                시스템ID: o.id,
                주문번호: o.orderNo,
                상태: o.status,
                주문일: formatDate(o.date),
                주문자: u.storeName || o.userName,
                연락처: u.mobile,
                입금자명: o.depositor || u.repName,
                주소: u.address,
                상품: (o.items || [])
                    .map((i) => `${i.name}(${i.quantity})`)
                    .join(", "),
                총액: o.totalAmount,
                택배사: o.courier || "",
                송장번호: o.trackingNumber || "",
            };
        });

        const ws = window.XLSX.utils.json_to_sheet(excelData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, "주문목록");
        window.XLSX.writeFile(
            wb,
            `주문목록_${new Date().toISOString().slice(0, 10)}.xlsx`
        );
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = window.XLSX.read(data, { type: "array" });
                const rows = window.XLSX.utils.sheet_to_json(
                    workbook.Sheets[workbook.SheetNames[0]]
                );
                let cnt = 0;
                for (let row of rows) {
                    if (row["시스템ID"] && row["송장번호"]) {
                        await window.fb.updateDoc(
                            window.fb.doc(window.db, "orders", row["시스템ID"]),
                            {
                                status: "배송중",
                                trackingNumber: String(row["송장번호"]),
                                courier: row["택배사"] || "CJ대한통운",
                            }
                        );
                        cnt++;
                    }
                }
                alert(`${cnt}건 송장 등록 완료`);
            } catch (err) {
                alert("엑셀 오류: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        const form = e.target;
        const newProd = {
            name: form.pName.value,
            category: form.pCategory.value,
            price: Number(form.pPrice.value) || 0,
            originPrice: Number(form.pOriginPrice.value) || 0,
            stock: Number(form.pStock.value) || 0,
            minQty: Number(form.pMinQty.value) || 1,
            cartonQty: Number(form.pCartonQty.value) || 1,
            image: thumbImage || "📦",
            detailImage: detailImage || "",
            description: form.pDescription.value,
            rating: "5.0",
            isHidden: form.pIsHidden.checked,
        };
        try {
            if (editingProduct)
                await window.fb.updateDoc(
                    window.fb.doc(
                        window.db,
                        "products_final_v5",
                        editingProduct.id
                    ),
                    newProd
                );
            else
                await window.fb.addDoc(
                    window.fb.collection(window.db, "products_final_v5"),
                    newProd
                );
            setIsProductModalOpen(false);
            alert("저장됨");
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (confirm("삭제?"))
            await window.fb.deleteDoc(
                window.fb.doc(window.db, "products_final_v5", id)
            );
    };

    const handleDeleteUser = async (id) => {
        if (confirm("삭제?"))
            await window.fb.deleteDoc(
                window.fb.doc(window.db, "users", id)
            );
    };

    const handleSaveBanners = async () => {
        try {
            await window.fb.setDoc(
                window.fb.doc(window.db, "config", "banners"),
                {
                    top: topBanner,
                    middle: middleBanner,
                }
            );
            alert("배너 저장 완료");
        } catch (e) {
            alert("배너 저장 실패: " + e.message);
        }
    };

    const handleRefreshUsers = async () => {
        try {
            if (window.fb && window.fb.getDocs) {
                const snap = await window.fb.getDocs(
                    window.fb.collection(window.db, "users")
                );
                setUsers(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                    }))
                );
                alert("회원 목록 갱신 완료");
            } else {
                alert("기능 로딩중...");
            }
        } catch (e) {
            console.error(e);
            alert("불러오기 실패: " + e.message);
        }
    };

    const openAddModal = () => {
        setEditingProduct(null);
        setThumbImage("");
        setDetailImage("");
        setIsProductModalOpen(true);
    };

    const openEditModal = (p) => {
        setEditingProduct(p);
        setThumbImage(p.image);
        setDetailImage(p.detailImage);
        setIsProductModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            <nav className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-lg sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <span className="bg-red-500 text-xs px-2 py-1 rounded font-bold">
                        ADMIN
                    </span>
                    <span className="font-bold text-lg">
                        SJ 파트너스 관리자
                    </span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onToShop}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm font-bold flex gap-2 items-center"
                    >
                        <Icon name="Store" className="w-4 h-4" />
                        쇼핑몰
                    </button>
                    <button
                        onClick={onLogout}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold"
                    >
                        로그아웃
                    </button>
                </div>
            </nav>

            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-6">
                <div className="flex gap-2 border-b border-slate-300 pb-1 overflow-x-auto">
                    {["orders", "users", "products", "banners"].map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-6 py-3 rounded-t-lg font-bold text-sm uppercase transition-colors whitespace-nowrap ${
                                tab === t
                                    ? "bg-white text-slate-900 border border-b-0 border-slate-300 shadow-sm"
                                    : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                            }`}
                        >
                            {t === "orders"
                                ? "주문 통합 관리"
                                : t === "users"
                                ? "회원 관리"
                                : t === "products"
                                ? "상품 관리"
                                : "배너 관리"}
                        </button>
                    ))}
                </div>

                {tab === "orders" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                {
                                    label: "결제완료(신규)",
                                    count: countStatus("접수대기"),
                                    color: "text-blue-600",
                                    bg: "bg-blue-50",
                                },
                                {
                                    label: "배송준비",
                                    count: countStatus("배송준비"),
                                    color: "text-indigo-600",
                                    bg: "bg-indigo-50",
                                },
                                {
                                    label: "배송지시",
                                    count: countStatus("배송지시"),
                                    color: "text-orange-600",
                                    bg: "bg-orange-50",
                                },
                                {
                                    label: "배송중",
                                    count: countStatus("배송중"),
                                    color: "text-green-600",
                                    bg: "bg-green-50",
                                },
                                {
                                    label: "배송완료",
                                    count: countStatus("배송완료"),
                                    color: "text-slate-600",
                                    bg: "bg-slate-50",
                                },
                            ].map((card, idx) => (
                                <div
                                    key={idx}
                                    onClick={() =>
                                        handleCardClick(card.label)
                                    }
                                    className={`p-5 rounded-lg border shadow-sm flex flex-col justify-between h-28 ${card.bg} cursor-pointer hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-slate-200`}
                                >
                                    <div className="text-sm font-bold text-slate-500 flex items-center gap-1">
                                        {card.label}
                                        <Icon
                                            name="ChevronRight"
                                            className="w-3 h-3 text-slate-400"
                                        />
                                    </div>
                                    <div
                                        className={`text-3xl font-bold ${card.color}`}
                                    >
                                        {card.count}{" "}
                                        <span className="text-base text-slate-400 font-normal">
                                            건
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <span className="w-20 font-bold text-sm text-slate-600">
                                    기간
                                </span>
                                <div className="flex gap-1">
                                    {["오늘", "7일", "30일", "전체"].map(
                                        (d) => (
                                            <button
                                                key={d}
                                                onClick={() =>
                                                    handleDateBtn(d)
                                                }
                                                className={`px-3 py-1.5 border rounded text-xs font-bold ${
                                                    searchInputs.dateType ===
                                                    d
                                                        ? "bg-slate-800 text-white border-slate-800"
                                                        : "bg-white text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {d}
                                            </button>
                                        )
                                    )}
                                </div>
                                <input
                                    type="date"
                                    className="border rounded px-2 py-1 text-sm text-slate-500"
                                    value={searchInputs.startDate}
                                    onChange={(e) =>
                                        setSearchInputs({
                                            ...searchInputs,
                                            startDate: e.target.value,
                                        })
                                    }
                                />
                                <span className="text-slate-400">~</span>
                                <input
                                    type="date"
                                    className="border rounded px-2 py-1 text-sm text-slate-500"
                                    value={searchInputs.endDate}
                                    onChange={(e) =>
                                        setSearchInputs({
                                            ...searchInputs,
                                            endDate: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center">
                                <span className="w-20 font-bold text-sm text-slate-600">
                                    배송상태
                                </span>
                                <div className="flex gap-4">
                                    {[
                                        "전체",
                                        "접수대기",
                                        "배송준비",
                                        "배송중",
                                        "배송완료",
                                        "주문취소",
                                    ].map((s) => (
                                        <label
                                            key={s}
                                            className="flex items-center gap-2 cursor-pointer text-sm"
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                checked={
                                                    searchInputs.status === s
                                                }
                                                onChange={() =>
                                                    setSearchInputs({
                                                        ...searchInputs,
                                                        status: s,
                                                    })
                                                }
                                                className="accent-blue-600"
                                            />
                                            {s === "접수대기"
                                                ? "결제완료(신규)"
                                                : s}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 items-center border-t pt-4">
                                <span className="w-20 font-bold text-sm text-slate-600">
                                    상세조건
                                </span>
                                <select
                                    className="border rounded px-2 py-2 text-sm bg-slate-50 min-w-[120px]"
                                    value={searchInputs.searchType}
                                    onChange={(e) =>
                                        setSearchInputs({
                                            ...searchInputs,
                                            searchType: e.target.value,
                                        })
                                    }
                                >
                                    <option value="주문자명">주문자명</option>
                                    <option value="주문번호">주문번호</option>
                                </select>
                                <input
                                    className="border rounded px-3 py-2 text-sm w-full md:w-96"
                                    placeholder="검색어 입력"
                                    value={searchInputs.keyword}
                                    onChange={(e) =>
                                        setSearchInputs({
                                            ...searchInputs,
                                            keyword: e.target.value,
                                        })
                                    }
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                            handleSearch();
                                    }}
                                />
                                <div className="ml-auto flex gap-2">
                                    <button
                                        onClick={handleReset}
                                        className="px-4 py-2 border rounded text-sm font-bold hover:bg-slate-50"
                                    >
                                        초기화
                                    </button>
                                    <button
                                        onClick={handleSearch}
                                        className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-sm"
                                    >
                                        검색
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                            <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3 bg-slate-50/50">
                                <div className="flex gap-2 items-center">
                                    <span className="font-bold text-sm mr-2">
                                        {selectedIds.size}개 선택됨
                                    </span>
                                    <button
                                        onClick={() =>
                                            handleBatchStatus("배송준비")
                                        }
                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
                                    >
                                        <Icon
                                            name="Package"
                                            className="w-3 h-3"
                                        />
                                        배송준비
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleBatchStatus("배송중")
                                        }
                                        className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                                    >
                                        <Icon
                                            name="Truck"
                                            className="w-3 h-3"
                                        />
                                        배송중 처리
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleBatchStatus("주문취소")
                                        }
                                        className="bg-white border text-slate-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-50"
                                    >
                                        취소 처리
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExcelDownload}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 flex items-center gap-1"
                                    >
                                        <Icon
                                            name="Download"
                                            className="w-3 h-3"
                                        />
                                        엑셀 다운
                                    </button>
                                    <button
                                        onClick={() =>
                                            excelInputRef.current &&
                                            excelInputRef.current.click()
                                        }
                                        className="bg-slate-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
                                    >
                                        <Icon
                                            name="Upload"
                                            className="w-3 h-3"
                                        />
                                        송장 일괄 등록
                                    </button>
                                    <input
                                        type="file"
                                        ref={excelInputRef}
                                        className="hidden"
                                        onChange={handleExcelUpload}
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto min-h-[400px]">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-slate-100 text-slate-500 font-bold border-b text-xs uppercase">
                                        <tr>
                                            <th className="p-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="p-3">주문번호</th>
                                            <th className="p-3">택배사</th>
                                            <th className="p-3">송장번호</th>
                                            <th className="p-3">배송상태</th>
                                            <th className="p-3">주문일시</th>
                                            <th className="p-3">
                                                주문자/수취인
                                            </th>
                                            <th className="p-3">
                                                상품명/옵션/수량
                                            </th>
                                            <th className="p-3">총금액</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredOrders.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={9}
                                                    className="text-center text-slate-400 py-10"
                                                >
                                                    데이터 없음
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredOrders.map((o) => {
                                                const u = getUserInfo(
                                                    o.userId
                                                );
                                                return (
                                                    <tr
                                                        key={o.id}
                                                        className={`hover:bg-slate-50 ${
                                                            selectedIds.has(
                                                                o.id
                                                            )
                                                                ? "bg-blue-50/40"
                                                                : ""
                                                        }`}
                                                    >
                                                        <td className="p-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(
                                                                    o.id
                                                                )}
                                                                onChange={() =>
                                                                    toggleSelect(
                                                                        o.id
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-3 font-mono text-xs">
                                                            {o.orderNo ||
                                                                "-"}
                                                        </td>
                                                        <td className="p-3">
                                                            <select
                                                                className="border rounded px-2 py-1 text-xs"
                                                                value={
                                                                    o.courier ||
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    handleUpdateTracking(
                                                                        o.id,
                                                                        e.target
                                                                            .value,
                                                                        o.trackingNumber
                                                                    )
                                                                }
                                                            >
                                                                <option value="">
                                                                    선택
                                                                </option>
                                                                {COURIERS.map(
                                                                    (c) => (
                                                                        <option
                                                                            key={
                                                                                c
                                                                            }
                                                                            value={
                                                                                c
                                                                            }
                                                                        >
                                                                            {c}
                                                                        </option>
                                                                    )
                                                                )}
                                                            </select>
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                className="border rounded px-2 py-1 w-32 text-xs"
                                                                value={
                                                                    o.trackingNumber ||
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    handleUpdateTracking(
                                                                        o.id,
                                                                        o.courier,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <select
                                                                className="border rounded px-2 py-1 text-xs"
                                                                value={
                                                                    o.status
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    window.fb.updateDoc(
                                                                        window.fb.doc(
                                                                            window.db,
                                                                            "orders",
                                                                            o.id
                                                                        ),
                                                                        {
                                                                            status:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        }
                                                                    )
                                                                }
                                                            >
                                                                <option value="접수대기">
                                                                    결제완료(신규)
                                                                </option>
                                                                <option value="배송준비">
                                                                    배송준비
                                                                </option>
                                                                <option value="배송중">
                                                                    배송중
                                                                </option>
                                                                <option value="배송완료">
                                                                    배송완료
                                                                </option>
                                                                <option value="주문취소">
                                                                    주문취소
                                                                </option>
                                                            </select>
                                                        </td>
                                                        <td className="p-3 text-xs text-slate-500">
                                                            {new Date(
                                                                o.date
                                                            ).toLocaleString()}
                                                        </td>
                                                        <td className="p-3 text-xs">
                                                            <div className="font-bold">
                                                                {u.storeName ||
                                                                    o.userName}
                                                            </div>
                                                            <div className="text-slate-400">
                                                                {u.mobile}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 text-xs max-w-xs">
                                                            {(o.items || []).map(
                                                                (
                                                                    item,
                                                                    idx
                                                                ) => (
                                                                    <div
                                                                        key={
                                                                            idx
                                                                        }
                                                                        className="truncate"
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            item.quantity
                                                                        }
                                                                        개)
                                                                    </div>
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="p-3 font-bold text-right">
                                                            ₩
                                                            {formatPrice(
                                                                o.totalAmount
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "users" && (
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">회원 관리</h3>
                            <button
                                onClick={handleRefreshUsers}
                                className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700"
                            >
                                목록 새로고침
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold border-b text-xs uppercase">
                                    <tr>
                                        <th className="p-3">상호명</th>
                                        <th className="p-3">대표자</th>
                                        <th className="p-3">이메일</th>
                                        <th className="p-3">연락처</th>
                                        <th className="p-3">주소</th>
                                        <th className="p-3">추천인</th>
                                        <th className="p-3">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-center text-slate-400 py-10"
                                            >
                                                회원 없음
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((u) => (
                                            <tr
                                                key={u.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="p-3 font-bold">
                                                    {u.storeName}
                                                </td>
                                                <td className="p-3">
                                                    {u.repName}
                                                </td>
                                                <td className="p-3">
                                                    {u.email}
                                                </td>
                                                <td className="p-3">
                                                    {u.mobile}
                                                </td>
                                                <td className="p-3 text-xs max-w-xs">
                                                    {u.address}
                                                </td>
                                                <td className="p-3 text-indigo-600">
                                                    {u.recommender || "-"}
                                                </td>
                                                <td className="p-3">
                                                    <button
                                                        onClick={() =>
                                                            setSelectedUser(u)
                                                        }
                                                        className="text-xs bg-slate-200 px-3 py-1 rounded-lg font-bold hover:bg-slate-300"
                                                    >
                                                        상세
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteUser(
                                                                u.id
                                                            )
                                                        }
                                                        className="ml-2 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-lg font-bold hover:bg-red-200"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {selectedUser && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-lg">
                                            회원 상세 정보
                                        </h4>
                                        <button
                                            onClick={() =>
                                                setSelectedUser(null)
                                            }
                                            className="p-1 rounded-full hover:bg-slate-100"
                                        >
                                            <Icon name="X" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                상호명
                                            </span>
                                            <span className="font-bold">
                                                {selectedUser.storeName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                대표자
                                            </span>
                                            <span className="font-bold">
                                                {selectedUser.repName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                이메일
                                            </span>
                                            <span className="font-bold">
                                                {selectedUser.email}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                연락처
                                            </span>
                                            <span className="font-bold">
                                                {selectedUser.mobile}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                주소
                                            </span>
                                            <span className="font-bold">
                                                {selectedUser.address}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-400 mr-1">
                                                추천인
                                            </span>
                                            <span className="font-bold text-indigo-600">
                                                {selectedUser.recommender ||
                                                    "없음"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end">
                                        <button
                                            onClick={() =>
                                                setSelectedUser(null)
                                            }
                                            className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800"
                                        >
                                            닫기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === "products" && (
                    <div className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">상품 관리</h3>
                            <button
                                onClick={openAddModal}
                                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800"
                            >
                                상품 등록
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold border-b text-xs uppercase">
                                    <tr>
                                        <th className="p-3">이미지</th>
                                        <th className="p-3">상품명</th>
                                        <th className="p-3">판매가</th>
                                        <th className="p-3">재고</th>
                                        <th className="p-3">상태</th>
                                        <th className="p-3">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="text-center text-slate-400 py-10"
                                            >
                                                상품 없음
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map((p) => (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="p-3">
                                                    {p.image &&
                                                    p.image !== "📦" ? (
                                                        <img
                                                            src={p.image}
                                                            className="w-10 h-10 object-cover rounded"
                                                        />
                                                    ) : (
                                                        "📦"
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {p.category}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    ₩{formatPrice(p.price)}
                                                </td>
                                                <td className="p-3 font-bold text-blue-600">
                                                    {p.stock}
                                                </td>
                                                <td className="p-3">
                                                    {p.isHidden ? (
                                                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                                                            판매중지
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-bold">
                                                            판매중
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            openEditModal(p)
                                                        }
                                                        className="bg-slate-200 px-3 py-1 rounded text-xs font-bold"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteProduct(
                                                                p.id
                                                            )
                                                        }
                                                        className="bg-red-100 text-red-500 px-3 py-1 rounded text-xs font-bold"
                                                    >
                                                        삭제
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {isProductModalOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-lg">
                                            {editingProduct
                                                ? "상품 수정"
                                                : "상품 등록"}
                                        </h4>
                                        <button
                                            onClick={() =>
                                                setIsProductModalOpen(false)
                                            }
                                            className="p-1 rounded-full hover:bg-slate-100"
                                        >
                                            <Icon name="X" />
                                        </button>
                                    </div>
                                    <form
                                        className="space-y-4"
                                        onSubmit={handleSaveProduct}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    상품명
                                                </label>
                                                <input
                                                    name="pName"
                                                    defaultValue={
                                                        editingProduct?.name ||
                                                        ""
                                                    }
                                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    카테고리
                                                </label>
                                                <select
                                                    name="pCategory"
                                                    defaultValue={
                                                        editingProduct
                                                            ?.category || ""
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                >
                                                    <option value="">
                                                        선택
                                                    </option>
                                                    {CATEGORIES.filter(
                                                        (c) => c !== "전체"
                                                    ).map((c) => (
                                                        <option
                                                            key={c}
                                                            value={c}
                                                        >
                                                            {c}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    판매가
                                                </label>
                                                <input
                                                    name="pPrice"
                                                    type="number"
                                                    defaultValue={
                                                        editingProduct?.price ||
                                                        ""
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    원가
                                                </label>
                                                <input
                                                    name="pOriginPrice"
                                                    type="number"
                                                    defaultValue={
                                                        editingProduct?.originPrice ||
                                                        ""
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    재고
                                                </label>
                                                <input
                                                    name="pStock"
                                                    type="number"
                                                    defaultValue={
                                                        editingProduct?.stock ||
                                                        ""
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    최소 주문수량
                                                </label>
                                                <input
                                                    name="pMinQty"
                                                    type="number"
                                                    defaultValue={
                                                        editingProduct?.minQty ||
                                                        1
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-1 text-slate-700">
                                                    박스 입수량
                                                </label>
                                                <input
                                                    name="pCartonQty"
                                                    type="number"
                                                    defaultValue={
                                                        editingProduct?.cartonQty ||
                                                        1
                                                    }
                                                    className="w-full border p-3 rounded-lg"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <input
                                                    type="checkbox"
                                                    name="pIsHidden"
                                                    defaultChecked={
                                                        editingProduct?.isHidden ||
                                                        false
                                                    }
                                                    className="w-4 h-4"
                                                />
                                                <span className="text-sm text-slate-600">
                                                    판매 중지
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ImageUploader
                                                label="썸네일 이미지"
                                                currentImage={thumbImage}
                                                onImageSelect={setThumbImage}
                                            />
                                            <ImageUploader
                                                label="상세 이미지"
                                                currentImage={detailImage}
                                                onImageSelect={setDetailImage}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold mb-1 text-slate-700">
                                                상세 설명
                                            </label>
                                            <textarea
                                                name="pDescription"
                                                defaultValue={
                                                    editingProduct?.description ||
                                                    ""
                                                }
                                                className="w-full border p-3 rounded-lg min-h-[100px]"
                                            />
                                        </div>

                                        <div className="flex justify-end gap-2 mt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setIsProductModalOpen(false)
                                                }
                                                className="px-4 py-2 border rounded-lg text-sm font-bold hover:bg-slate-50"
                                            >
                                                취소
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800"
                                            >
                                                저장
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === "banners" && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 max-w-3xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">
                                쇼핑몰 배너 관리
                            </h3>
                            <button
                                onClick={handleSaveBanners}
                                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg"
                            >
                                설정 저장
                            </button>
                        </div>
                        <div className="space-y-8">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Icon
                                        name="LayoutTemplate"
                                        className="w-5 h-5"
                                    />{" "}
                                    메인 상단 배너
                                </h4>
                                <ImageUploader
                                    label="상단 배너 이미지 업로드"
                                    currentImage={topBanner}
                                    onImageSelect={setTopBanner}
                                />
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Icon
                                        name="CreditCard"
                                        className="w-5 h-5"
                                    />{" "}
                                    중간 띠 배너
                                </h4>
                                <ImageUploader
                                    label="중간 배너 이미지 업로드"
                                    currentImage={middleBanner}
                                    onImageSelect={setMiddleBanner}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [4] 로그인 페이지
// ----------------------------------------------------
const LoginPage = ({ onAdminLogin }) => {
    const emailRef = useRef(null);
    const passRef = useRef(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = emailRef.current.value.trim();
        const pw = passRef.current.value.trim();
        if (!email || !pw) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }
        try {
            setLoading(true);
            await window.fb.signInUser(window.auth, email, pw);
        } catch (err) {
            alert("로그인 실패: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">
                    SJ 파트너스 로그인
                </h1>
                <form className="space-y-4" onSubmit={handleLogin}>
                    <div>
                        <label className="block mb-1 text-sm font-bold text-slate-700">
                            이메일
                        </label>
                        <input
                            ref={emailRef}
                            type="email"
                            className="w-full border p-3 rounded-lg"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <label className="block mb-1 text-sm font-bold text-slate-700">
                            비밀번호
                        </label>
                        <input
                            ref={passRef}
                            type="password"
                            className="w-full border p-3 rounded-lg"
                            placeholder="********"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800"
                    >
                        {loading ? "로그인 중..." : "로그인"}
                    </button>
                </form>
                <button
                    onClick={onAdminLogin}
                    className="mt-4 w-full text-xs text-slate-400"
                >
                    (임시) 관리자 모드로 바로 보기
                </button>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// [5] 쇼핑몰 메인 페이지
// ----------------------------------------------------
const ShopPage = ({ products, user, onLogout, isAdmin, onToAdmin }) => {
    const [category, setCategory] = useState("전체");
    const [cart, setCart] = useState([]);
    const [step, setStep] = useState("list");
    const [depositor, setDepositor] = useState("");
    const [showMyPage, setShowMyPage] = useState(false);
    const [topBanner, setTopBanner] = useState(DEFAULT_BANNERS.top);
    const [middleBanner, setMiddleBanner] = useState(DEFAULT_BANNERS.middle);

    useLucide();

    useEffect(() => {
        if (!window.fb || !window.fb.getDoc) return;
        const loadBanners = async () => {
            try {
                const docRef = window.fb.doc(
                    window.db,
                    "config",
                    "banners"
                );
                const snap = await window.fb.getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    setTopBanner(data.top || "");
                    setMiddleBanner(data.middle || "");
                }
            } catch (e) {
                console.log("배너 불러오기 실패", e);
            }
        };
        loadBanners();
    }, []);

    const filteredProducts =
        category === "전체"
            ? products
            : products.filter((p) => p.category === category);

    const addToCart = (p) => {
        setCart((prev) => {
            const exist = prev.find((c) => c.id === p.id);
            if (exist) {
                return prev.map((c) =>
                    c.id === p.id
                        ? { ...c, quantity: c.quantity + 1 }
                        : c
                );
            }
            return [...prev, { ...p, quantity: p.minQty || 1 }];
        });
    };

    const updateQty = (id, qty) => {
        if (qty <= 0) return;
        setCart((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, quantity: qty } : c
            )
        );
    };

    const removeFromCart = (id) => {
        setCart((prev) => prev.filter((c) => c.id !== id));
    };

    const handleOrder = () => {
        if (cart.length === 0) {
            alert("장바구니가 비어 있습니다.");
            return;
        }
        setStep("order");
    };

    const handleFinalOrder = async () => {
        if (!window.fb || !window.auth || !window.auth.currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }
        if (!depositor.trim()) {
            alert("입금자명을 입력해주세요.");
            return;
        }

        const orderData = {
            userId: window.auth.currentUser.uid,
            userName: user.repName,
            items: cart.map((c) => ({
                id: c.id,
                name: c.name,
                quantity: c.quantity,
                price: c.price,
            })),
            totalAmount: cart.reduce(
                (a, c) => a + c.price * c.quantity,
                0
            ),
            status: "접수대기",
            date: new Date().toISOString(),
            depositor,
        };

        try {
            await window.fb.addDoc(
                window.fb.collection(window.db, "orders"),
                orderData
            );
            alert("주문이 접수되었습니다.");
            setCart([]);
            setStep("list");
            setDepositor("");
        } catch (e) {
            alert("주문 실패: " + e.message);
        }
    };

    const handleClose = () => setShowMyPage(false);

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg text-slate-900">
                            SJ 파트너스 몰
                        </span>
                        {isAdmin && (
                            <span className="ml-2 text-xs bg-slate-900 text-white px-2 py-1 rounded-full">
                                관리자
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-600">
                            {user.storeName} / {user.repName} 님
                        </span>
                        <button
                            onClick={() => setShowMyPage(true)}
                            className="px-3 py-1 rounded-full border text-slate-600 hover:bg-slate-100"
                        >
                            마이페이지
                        </button>
                        {isAdmin && (
                            <button
                                onClick={onToAdmin}
                                className="px-3 py-1 rounded-full bg-slate-900 text-white hover:bg-slate-800"
                            >
                                관리자 페이지
                            </button>
                        )}
                        <button
                            onClick={onLogout}
                            className="px-3 py-1 rounded-full border text-slate-600 hover:bg-slate-100"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                {topBanner && (
                    <div className="rounded-xl overflow-hidden shadow-sm border">
                        <img
                            src={topBanner}
                            alt="상단 배너"
                            className="w-full object-cover"
                        />
                    </div>
                )}

                <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c}
                            onClick={() => setCategory(c)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                                category === c
                                    ? "bg-slate-900 text-white"
                                    : "bg-white text-slate-700 border"
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {middleBanner && (
                    <div className="rounded-xl overflow-hidden shadow-sm border">
                        <img
                            src={middleBanner}
                            alt="중간 배너"
                            className="w-full object-cover"
                        />
                    </div>
                )}

                {step === "list" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {filteredProducts.length === 0 ? (
                            <div className="col-span-full text-center text-slate-400 py-10">
                                상품이 없습니다.
                            </div>
                        ) : (
                            filteredProducts.map((p) => (
                                <div
                                    key={p.id}
                                    className="bg-white rounded-xl shadow-sm border flex flex-col"
                                >
                                    <div className="aspect-[4/3] bg-slate-100 rounded-t-xl overflow-hidden flex items-center justify-center">
                                        {p.image && p.image !== "📦" ? (
                                            <img
                                                src={p.image}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-4xl">
                                                📦
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="text-xs text-slate-400 mb-1">
                                            {p.category}
                                        </div>
                                        <h3 className="font-bold text-sm mb-1">
                                            {p.name}
                                        </h3>
                                        <div className="mt-auto">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <div className="text-xs text-slate-400 line-through">
                                                        {p.originPrice
                                                            ? `₩${formatPrice(
                                                                  p.originPrice
                                                              )}`
                                                            : ""}
                                                    </div>
                                                    <div className="text-lg font-extrabold text-blue-600">
                                                        ₩
                                                        {formatPrice(p.price)}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    재고: {p.stock}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addToCart(p)}
                                                className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-slate-800"
                                            >
                                                장바구니 담기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {step === "order" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <h2 className="font-bold text-lg mb-3">
                                장바구니
                            </h2>
                            <div className="bg-white rounded-xl shadow-sm border divide-y">
                                {cart.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400">
                                        장바구니가 비어 있습니다.
                                    </div>
                                ) : (
                                    cart.map((c) => (
                                        <div
                                            key={c.id}
                                            className="p-4 flex items-center gap-4"
                                        >
                                            <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                                                {c.image && c.image !== "📦" ? (
                                                    <img
                                                        src={c.image}
                                                        alt={c.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl">
                                                        📦
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-sm">
                                                    {c.name}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    최소 주문수량{" "}
                                                    {c.minQty || 1}개
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex items-center border rounded-full overflow-hidden">
                                                    <button
                                                        onClick={() =>
                                                            updateQty(
                                                                c.id,
                                                                c.quantity - 1
                                                            )
                                                        }
                                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                                                    >
                                                        -
                                                    </button>
                                                    <input
                                                        type="number"
                                                        className="w-12 text-center text-sm border-x"
                                                        value={c.quantity}
                                                        onChange={(e) =>
                                                            updateQty(
                                                                c.id,
                                                                Number(
                                                                    e.target
                                                                        .value
                                                                )
                                                            )
                                                        }
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            updateQty(
                                                                c.id,
                                                                c.quantity + 1
                                                            )
                                                        }
                                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="text-sm font-bold text-blue-600">
                                                    ₩
                                                    {formatPrice(
                                                        c.price * c.quantity
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        removeFromCart(c.id)
                                                    }
                                                    className="text-xs text-red-500"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg mb-3">
                                주문 정보
                            </h2>
                            <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
                                <div className="text-sm">
                                    <div className="font-bold mb-1">
                                        입금 계좌
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between">
                                        <span className="text-xs text-blue-800">
                                            {BANK_INFO.bankName}{" "}
                                            {BANK_INFO.accountNumber}
                                        </span>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    BANK_INFO.accountNumber
                                                );
                                                alert(
                                                    "계좌번호가 복사되었습니다."
                                                );
                                            }}
                                            className="text-xs bg-white border border-blue-200 px-2 py-1 rounded text-blue-600 hover:bg-blue-100"
                                        >
                                            복사
                                        </button>
                                    </div>
                                    <div className="text-sm text-slate-600">
                                        예금주: {BANK_INFO.holder}
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold mb-1 text-slate-700">
                                        입금자명 (필수)
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="예: 김철수 (SJ문구)"
                                        value={depositor}
                                        onChange={(e) =>
                                            setDepositor(e.target.value)
                                        }
                                    />
                                    <p className="text-xs text-slate-400 mt-1">
                                        * 실제 입금하시는 분의 성함을
                                        입력해주세요.
                                    </p>
                                </div>
                                <div className="flex justify-between items-center mb-4 pt-4 border-t">
                                    <span className="text-slate-600 font-bold">
                                        총 결제금액
                                    </span>
                                    <span className="text-xl font-bold text-blue-600">
                                        ₩
                                        {formatPrice(
                                            cart.reduce(
                                                (a, c) =>
                                                    a +
                                                    c.price * c.quantity,
                                                0
                                            )
                                        )}
                                    </span>
                                </div>
                                <button
                                    onClick={handleFinalOrder}
                                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 shadow-lg"
                                >
                                    입금 확인 요청 (주문 완료)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {showMyPage && (
                    <MyPage user={user} onClose={handleClose} />
                )}
            </main>
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
        const savedAdminMode =
            localStorage.getItem("adminViewMode") === "true";
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
        const unsub = onSnapshot(
            collection(window.db, "products_final_v5"),
            (snap) => {
                setProducts(
                    snap.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                    }))
                );
            }
        );
        const authUnsub = window.fb.onAuthStateChanged(
            window.auth,
            async (u) => {
                if (u) {
                    try {
                        const userDoc = await getDoc(
                            doc(window.db, "users", u.uid)
                        );
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUser({ ...u, ...userData });
                            setIsAdmin(userData.isAdmin === true);
                        } else {
                            setUser(u);
                            setIsAdmin(false);
                        }
                    } catch (e) {
                        setUser(u);
                    }
                } else {
                    setUser(null);
                    setIsAdmin(false);
                    localStorage.removeItem("adminViewMode");
                }
                setLoading(false);
            }
        );
        return () => {
            unsub();
            authUnsub();
        };
    }, [firebaseReady]);

    const handleForceAdmin = () => {
        setIsAdmin(true);
        setUser({
            email: "admin@sj.com",
            storeName: "관리자(임시)",
        });
    };

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

    if (!firebaseReady || loading)
        return (
            <div className="h-screen flex flex-col items-center justify-center font-bold text-slate-400 bg-slate-50 gap-4">
                <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                <div>시스템 연결중.</div>
            </div>
        );
    if (isAdmin && adminViewMode)
        return (
            <AdminPage onLogout={handleLogout} onToShop={handleToShop} />
        );
    if (user)
        return (
            <ShopPage
                products={products}
                user={user}
                onLogout={handleLogout}
                isAdmin={isAdmin}
                onToAdmin={handleToAdmin}
            />
        );
    return <LoginPage onAdminLogin={handleForceAdmin} />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
