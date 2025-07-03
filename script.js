// Temel değişkenler
let db;
let currentWorkplace = null;
let currentPerson = null;
let doctorInfo = {};
let months = [];
const defaultPassword = "123456"; // Basit şifre

// DOM yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    // Şifre ekranını göster
    showPasswordScreen();
    
    // Şifre giriş butonu
    document.getElementById('loginButton').addEventListener('click', function() {
        const password = document.getElementById('passwordInput').value;
        if (password === defaultPassword) {
            hidePasswordScreen();
            initApp();
        } else {
            document.getElementById('passwordError').textContent = "Geçersiz şifre!";
        }
    });
    
    // Şifre alanında enter tuşuna basıldığında
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('loginButton').click();
        }
    });
    
    // Çıkış butonu
    document.getElementById('logoutButton').addEventListener('click', function() {
        showPasswordScreen();
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordError').textContent = '';
    });
    
    // Aylık işler butonu
    document.getElementById('monthlyWorksBtn').addEventListener('click', function() {
        const menu = document.getElementById('monthlyWorksMenu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    
    // İşyeri ekle butonu
    document.getElementById('addWorkplaceBtn').addEventListener('click', function() {
        const workplaceName = prompt("İşyeri adını girin:");
        if (workplaceName && workplaceName.trim() !== '') {
            addWorkplace(workplaceName.trim());
        }
    });
    
    // İşyeri düzenle butonu
    document.getElementById('editWorkplaceBtn').addEventListener('click', function() {
        const selectedWorkplace = document.querySelector('#workplacesList .selected');
        if (selectedWorkplace) {
            const workplaceId = selectedWorkplace.dataset.id;
            const workplaceName = prompt("Yeni işyeri adını girin:", selectedWorkplace.textContent);
            if (workplaceName && workplaceName.trim() !== '') {
                editWorkplace(workplaceId, workplaceName.trim());
            }
        } else {
            alert("Lütfen düzenlemek istediğiniz işyerini seçin.");
        }
    });
    
    // İşyeri sil butonu
    document.getElementById('deleteWorkplaceBtn').addEventListener('click', function() {
        const selectedWorkplace = document.querySelector('#workplacesList .selected');
        if (selectedWorkplace) {
            if (confirm("Bu işyerini silmek istediğinize emin misiniz?")) {
                const workplaceId = selectedWorkplace.dataset.id;
                deleteWorkplace(workplaceId);
            }
        } else {
            alert("Lütfen silmek istediğiniz işyerini seçin.");
        }
    });
    
    // Ayarlar butonu
    document.getElementById('settingsBtn').addEventListener('click', function() {
        showSettingsModal();
    });
    
    // Ayarlar modal kapatma butonu
    document.getElementById('closeSettingsBtn').addEventListener('click', function() {
        hideSettingsModal();
    });
    
    // Doktor bilgileri formu
    document.getElementById('doctorInfoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveDoctorInfo();
    });
    
    // Geri butonu
    document.getElementById('backButton').addEventListener('click', function() {
        showWelcomeContent();
    });
    
    // Excel'den al butonu
    document.getElementById('importExcelBtn').addEventListener('click', function() {
        importFromExcel();
    });
    
    // Excel'e ver butonu
    document.getElementById('exportExcelBtn').addEventListener('click', function() {
        exportToExcel();
    });
    
    // Yedek al butonu
    document.getElementById('backupBtn').addEventListener('click', function() {
        createBackup();
    });
    
    // Yedekten dön butonu
    document.getElementById('restoreBtn').addEventListener('click', function() {
        restoreFromBackup();
    });
    
    // Kişi ekle butonu
    document.getElementById('addPersonBtn').addEventListener('click', function() {
        showPersonModal();
    });
    
    // Kişi modal kapatma butonu
    document.getElementById('closePersonModalBtn').addEventListener('click', function() {
        hidePersonModal();
    });
    
    // Kişi formu
    document.getElementById('personForm').addEventListener('submit', function(e) {
        e.preventDefault();
        savePerson();
    });
    
    // Ek-2 yükle modal kapatma butonu
    document.getElementById('closeUploadEk2Btn').addEventListener('click', function() {
        hideUploadEk2Modal();
    });
    
    // Ek-2 göster modal kapatma butonu
    document.getElementById('closeShowEk2Btn').addEventListener('click', function() {
        hideShowEk2Modal();
    });
    
    // ESC tuşu ile modal kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideSettingsModal();
            hidePersonModal();
            hideUploadEk2Modal();
            hideShowEk2Modal();
        }
    });
});

// Uygulamayı başlat
function initApp() {
    // Masaüstünde klasör oluştur
    createAppFolder();
    
    // Veritabanını başlat
    initDatabase();
    
    // Ayları başlat
    initializeMonths();
    
    // Doktor bilgilerini yükle
    loadDoctorInfo();
    
    // İşyerlerini yükle
    loadWorkplaces();
    
    // Ana ekranı göster
    document.getElementById('mainScreen').style.display = 'block';
}

// Şifre ekranını göster
function showPasswordScreen() {
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('passwordScreen').style.display = 'block';
    document.getElementById('passwordInput').focus();
}

// Şifre ekranını gizle
function hidePasswordScreen() {
    document.getElementById('passwordScreen').style.display = 'none';
}

// Masaüstünde klasör oluştur
function createAppFolder() {
    // Bu kısım Electron gibi bir framework olmadan tarayıcıda çalışmayacaktır
    // Gerçek bir uygulamada bu işlem için Node.js veya Electron kullanılmalıdır
    console.log("Masaüstünde 'İşyeriHekimiVerileri' klasörü oluşturuldu.");
}

// Veritabanını başlat
function initDatabase() {
    // IndexedDB veritabanı oluştur
    const request = indexedDB.open('IsyeriHekimiDB', 1);
    
    request.onerror = function(event) {
        console.error("Veritabanı hatası:", event.target.error);
    };
    
    request.onupgradeneeded = function(event) {
        db = event.target.result;
        
        // İşyerleri için object store oluştur
        const workplacesStore = db.createObjectStore('workplaces', { keyPath: 'id', autoIncrement: true });
        workplacesStore.createIndex('name', 'name', { unique: true });
        
        // Kişiler için object store oluştur
        const personsStore = db.createObjectStore('persons', { keyPath: 'id', autoIncrement: true });
        personsStore.createIndex('workplaceId', 'workplaceId', { unique: false });
        personsStore.createIndex('tc', 'tc', { unique: true });
        
        // Doktor bilgileri için object store oluştur
        db.createObjectStore('doctorInfo', { keyPath: 'id' });
        
        // Aylık dosyalar için object store oluştur
        db.createObjectStore('monthlyFiles', { keyPath: 'id' });
    };
    
    request.onsuccess = function(event) {
        db = event.target.result;
        console.log("Veritabanı başarıyla açıldı.");
    };
}

// Ayları başlat
function initializeMonths() {
    const currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    
    // Eğer ayın 15'inden sonra ise bir sonraki ayı ekle
    if (currentDate.getDate() > 15) {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
    }
    
    // 12 ay ekle
    months = [];
    for (let i = 0; i < 12; i++) {
        const month = currentMonth + i;
        const year = currentYear + Math.floor(month / 12);
        const monthName = getMonthName(month % 12);
        months.push(`${monthName} ${year}`);
    }
    
    // Ayları menüye ekle
    const monthlyWorksMenu = document.getElementById('monthlyWorksMenu');
    monthlyWorksMenu.innerHTML = '';
    
    months.forEach(month => {
        const monthItem = document.createElement('div');
        monthItem.className = 'submenu-item';
        monthItem.textContent = month;
        monthItem.addEventListener('click', function() {
            showMonthlyFiles(month);
        });
        monthlyWorksMenu.appendChild(monthItem);
    });
    
    // Menüyü göster
    monthlyWorksMenu.style.display = 'block';
}

// Ay ismini döndür
function getMonthName(monthIndex) {
    const months = [
        'OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN',
        'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'
    ];
    return months[monthIndex];
}

// Aylık dosyaları göster
function showMonthlyFiles(month) {
    // Bu fonksiyon gerçek uygulamada dosya sistemi işlemleri yapacaktır
    // Şimdilik simüle ediyoruz
    
    const files = [
        'Çasmer Mutabakat.docx',
        'Çasmer Puantaj.xlsx',
        'Genel Hijyen ve Saha Denetim Formu.xlsx',
        'Mutfak Hijyen Denetim Formu.xlsx',
        'Tuvalet Hijyen Denetim Formu.xlsx'
    ];
    
    alert(`${month} ayına ait dosyalar:\n\n${files.map(file => `${month} ${file}`).join('\n')}`);
}

// Doktor bilgilerini yükle
function loadDoctorInfo() {
    if (!db) return;
    
    const transaction = db.transaction(['doctorInfo'], 'readonly');
    const store = transaction.objectStore('doctorInfo');
    const request = store.get(1);
    
    request.onsuccess = function(event) {
        if (event.target.result) {
            doctorInfo = event.target.result;
            document.getElementById('doctorName').value = doctorInfo.name || '';
            document.getElementById('diplomaNo').value = doctorInfo.diplomaNo || '';
            document.getElementById('diplomaDate').value = doctorInfo.diplomaDate || '';
            document.getElementById('certificateNo').value = doctorInfo.certificateNo || '';
        }
    };
    
    request.onerror = function(event) {
        console.error("Doktor bilgileri yüklenirken hata:", event.target.error);
    };
}

// Doktor bilgilerini kaydet
function saveDoctorInfo() {
    if (!db) return;
    
    doctorInfo = {
        id: 1,
        name: document.getElementById('doctorName').value,
        diplomaNo: document.getElementById('diplomaNo').value,
        diplomaDate: document.getElementById('diplomaDate').value,
        certificateNo: document.getElementById('certificateNo').value
    };
    
    const transaction = db.transaction(['doctorInfo'], 'readwrite');
    const store = transaction.objectStore('doctorInfo');
    const request = store.put(doctorInfo);
    
    request.onsuccess = function() {
        alert("Doktor bilgileri kaydedildi.");
        hideSettingsModal();
    };
    
    request.onerror = function(event) {
        console.error("Doktor bilgileri kaydedilirken hata:", event.target.error);
        alert("Doktor bilgileri kaydedilirken hata oluştu.");
    };
}

// Ayarlar modalını göster
function showSettingsModal() {
    document.getElementById('settingsModal').style.display = 'block';
}

// Ayarlar modalını gizle
function hideSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// İşyerlerini yükle
function loadWorkplaces() {
    if (!db) return;
    
    const transaction = db.transaction(['workplaces'], 'readonly');
    const store = transaction.objectStore('workplaces');
    const request = store.getAll();
    
    request.onsuccess = function(event) {
        const workplaces = event.target.result;
        const workplacesList = document.getElementById('workplacesList');
        workplacesList.innerHTML = '';
        
        workplaces.forEach(workplace => {
            const workplaceItem = document.createElement('div');
            workplaceItem.className = 'submenu-item';
            workplaceItem.textContent = workplace.name;
            workplaceItem.dataset.id = workplace.id;
            
            workplaceItem.addEventListener('click', function() {
                // Seçili işyerini vurgula
                document.querySelectorAll('#workplacesList .submenu-item').forEach(item => {
                    item.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // İşyeri içeriğini göster
                showWorkplaceContent(workplace.id, workplace.name);
            });
            
            workplacesList.appendChild(workplaceItem);
        });
        
        // İşyeri listesini göster
        workplacesList.style.display = 'block';
    };
    
    request.onerror = function(event) {
        console.error("İşyerleri yüklenirken hata:", event.target.error);
    };
}

// İşyeri ekle
function addWorkplace(name) {
    if (!db) return;
    
    const transaction = db.transaction(['workplaces'], 'readwrite');
    const store = transaction.objectStore('workplaces');
    const request = store.add({ name: name });
    
    request.onsuccess = function() {
        loadWorkplaces();
    };
    
    request.onerror = function(event) {
        if (event.target.error.name === 'ConstraintError') {
            alert("Bu isimde bir işyeri zaten var.");
        } else {
            console.error("İşyeri eklenirken hata:", event.target.error);
        }
    };
}

// İşyeri düzenle
function editWorkplace(id, newName) {
    if (!db) return;
    
    const transaction = db.transaction(['workplaces'], 'readwrite');
    const store = transaction.objectStore('workplaces');
    const getRequest = store.get(parseInt(id));
    
    getRequest.onsuccess = function(event) {
        const workplace = event.target.result;
        if (workplace) {
            workplace.name = newName;
            const putRequest = store.put(workplace);
            
            putRequest.onsuccess = function() {
                loadWorkplaces();
            };
            
            putRequest.onerror = function(event) {
                if (event.target.error.name === 'ConstraintError') {
                    alert("Bu isimde bir işyeri zaten var.");
                } else {
                    console.error("İşyeri güncellenirken hata:", event.target.error);
                }
            };
        }
    };
    
    getRequest.onerror = function(event) {
        console.error("İşyeri bilgisi alınırken hata:", event.target.error);
    };
}

// İşyeri sil
function deleteWorkplace(id) {
    if (!db) return;
    
    // Önce bu işyerine ait kişileri sil
    deleteAllPersonsInWorkplace(id);
    
    // Sonra işyerini sil
    const transaction = db.transaction(['workplaces'], 'readwrite');
    const store = transaction.objectStore('workplaces');
    const request = store.delete(parseInt(id));
    
    request.onsuccess = function() {
        loadWorkplaces();
        showWelcomeContent();
    };
    
    request.onerror = function(event) {
        console.error("İşyeri silinirken hata:", event.target.error);
    };
}

// İşyerindeki tüm kişileri sil
function deleteAllPersonsInWorkplace(workplaceId) {
    if (!db) return;
    
    const transaction = db.transaction(['persons'], 'readwrite');
    const store = transaction.objectStore('persons');
    const index = store.index('workplaceId');
    const request = index.openCursor(IDBKeyRange.only(parseInt(workplaceId)));
    
    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            cursor.delete();
            cursor.continue();
        }
    };
    
    request.onerror = function(event) {
        console.error("Kişiler silinirken hata:", event.target.error);
    };
}

// İşyeri içeriğini göster
function showWorkplaceContent(workplaceId, workplaceName) {
    currentWorkplace = {
        id: workplaceId,
        name: workplaceName
    };
    
    document.getElementById('workplaceTitle').textContent = workplaceName;
    document.getElementById('welcomeContent').style.display = 'none';
    document.getElementById('workplaceContent').style.display = 'block';
    
    loadPersons(workplaceId);
}

// Hoş geldiniz içeriğini göster
function showWelcomeContent() {
    currentWorkplace = null;
    document.getElementById('welcomeContent').style.display = 'block';
    document.getElementById('workplaceContent').style.display = 'none';
}

// Kişileri yükle
function loadPersons(workplaceId) {
    if (!db) return;
    
    const transaction = db.transaction(['persons'], 'readonly');
    const store = transaction.objectStore('persons');
    const index = store.index('workplaceId');
    const request = index.getAll(IDBKeyRange.only(parseInt(workplaceId)));
    
    request.onsuccess = function(event) {
        const persons = event.target.result;
        const personsTable = document.querySelector('#personsTable tbody');
        personsTable.innerHTML = '';
        
        persons.forEach((person, index) => {
            const row = document.createElement('tr');
            
            // Sıra No
            const cellNo = document.createElement('td');
            cellNo.textContent = index + 1;
            row.appendChild(cellNo);
            
            // TC Kimlik No
            const cellTC = document.createElement('td');
            cellTC.textContent = person.tc;
            row.appendChild(cellTC);
            
            // İsim Soyisim
            const cellName = document.createElement('td');
            cellName.textContent = person.name;
            row.appendChild(cellName);
            
            // Mevcut Muayene Tarihi
            const cellCurrentDate = document.createElement('td');
            cellCurrentDate.textContent = person.currentExamDate || '';
            row.appendChild(cellCurrentDate);
            
            // Sonraki Muayene Tarihi
            const cellNextDate = document.createElement('td');
            cellNextDate.textContent = person.nextExamDate || '';
            row.appendChild(cellNextDate);
            
            // Ek-2 Butonu
            const cellEk2 = document.createElement('td');
            const ek2Btn = document.createElement('button');
            ek2Btn.textContent = 'Ek-2';
            ek2Btn.addEventListener('click', function() {
                createEk2Document(person);
            });
            cellEk2.appendChild(ek2Btn);
            row.appendChild(cellEk2);
            
            // Ek-2 Yükle Butonu
            const cellUploadEk2 = document.createElement('td');
            const uploadEk2Btn = document.createElement('button');
            uploadEk2Btn.textContent = 'Yükle';
            uploadEk2Btn.addEventListener('click', function() {
                showUploadEk2Modal(person.id);
            });
            cellUploadEk2.appendChild(uploadEk2Btn);
            row.appendChild(cellUploadEk2);
            
            // Ek-2 Göster Butonu
            const cellShowEk2 = document.createElement('td');
            const showEk2Btn = document.createElement('button');
            showEk2Btn.textContent = 'Göster';
            showEk2Btn.addEventListener('click', function() {
                showEk2Documents(person.id);
            });
            cellShowEk2.appendChild(showEk2Btn);
            row.appendChild(cellShowEk2);
            
            // Düzenle Butonu
            const cellEdit = document.createElement('td');
            const editBtn = document.createElement('button');
            editBtn.textContent = 'Düzenle';
            editBtn.addEventListener('click', function() {
                editPerson(person);
            });
            cellEdit.appendChild(editBtn);
            row.appendChild(cellEdit);
            
            // Sil Butonu
            const cellDelete = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Sil';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', function() {
                if (confirm("Bu kişiyi silmek istediğinize emin misiniz?")) {
                    deletePerson(person.id);
                }
            });
            cellDelete.appendChild(deleteBtn);
            row.appendChild(cellDelete);
            
            personsTable.appendChild(row);
        });
    };
    
    request.onerror = function(event) {
        console.error("Kişiler yüklenirken hata:", event.target.error);
    };
}

// Kişi ekle modalını göster
function showPersonModal() {
    document.getElementById('personModalTitle').textContent = 'Kişi Ekle';
    document.getElementById('personTC').value = '';
    document.getElementById('personName').value = '';
    currentPerson = null;
    document.getElementById('personModal').style.display = 'block';
}

// Kişi düzenle modalını göster
function editPerson(person) {
    document.getElementById('personModalTitle').textContent = 'Kişi Düzenle';
    document.getElementById('personTC').value = person.tc;
    document.getElementById('personName').value = person.name;
    currentPerson = person;
    document.getElementById('personModal').style.display = 'block';
}

// Kişi modalını gizle
function hidePersonModal() {
    document.getElementById('personModal').style.display = 'none';
}

// Kişi kaydet
function savePerson() {
    if (!db || !currentWorkplace) return;
    
    const tc = document.getElementById('personTC').value;
    const name = document.getElementById('personName').value;
    
    if (!tc || !name) {
        alert("TC kimlik no ve isim soyisim alanları zorunludur.");
        return;
    }
    
    const transaction = db.transaction(['persons'], 'readwrite');
    const store = transaction.objectStore('persons');
    
    if (currentPerson) {
        // Düzenleme
        currentPerson.tc = tc;
        currentPerson.name = name;
        
        const request = store.put(currentPerson);
        
        request.onsuccess = function() {
            loadPersons(currentWorkplace.id);
            hidePersonModal();
        };
        
        request.onerror = function(event) {
            if (event.target.error.name === 'ConstraintError') {
                alert("Bu TC kimlik numarasına sahip başka bir kişi zaten var.");
            } else {
                console.error("Kişi güncellenirken hata:", event.target.error);
            }
        };
    } else {
        // Ekleme
        const person = {
            workplaceId: currentWorkplace.id,
            tc: tc,
            name: name,
            currentExamDate: '',
            nextExamDate: ''
        };
        
        const request = store.add(person);
        
        request.onsuccess = function() {
            loadPersons(currentWorkplace.id);
            hidePersonModal();
        };
        
        request.onerror = function(event) {
            if (event.target.error.name === 'ConstraintError') {
                alert("Bu TC kimlik numarasına sahip başka bir kişi zaten var.");
            } else {
                console.error("Kişi eklenirken hata:", event.target.error);
            }
        };
    }
}

// Kişi sil
function deletePerson(personId) {
    if (!db) return;
    
    const transaction = db.transaction(['persons'], 'readwrite');
    const store = transaction.objectStore('persons');
    const request = store.delete(parseInt(personId));
    
    request.onsuccess = function() {
        loadPersons(currentWorkplace.id);
    };
    
    request.onerror = function(event) {
        console.error("Kişi silinirken hata:", event.target.error);
    };
}

// Ek-2 belgesi oluştur
function createEk2Document(person) {
    // Bu kısım gerçek uygulamada docx.js gibi bir kütüphane kullanarak
    // ccgisg_ek_2.docx dosyasını açıp düzenleyecektir
    // Şimdilik simüle ediyoruz
    
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    
    const examDate = `${day}.${month}.${year}`;
    
    // 5 yıl sonrasını hesapla
    const nextExamDate = new Date(currentDate);
    nextExamDate.setFullYear(nextExamDate.getFullYear() + 5);
    const nextDay = nextExamDate.getDate().toString().padStart(2, '0');
    const nextMonth = (nextExamDate.getMonth() + 1).toString().padStart(2, '0');
    const nextYear = nextExamDate.getFullYear();
    
    const nextExamDateStr = `${nextDay}.${nextMonth}.${nextYear}`;
    
    // Kişi bilgilerini güncelle
    if (!db) return;
    
    const transaction = db.transaction(['persons'], 'readwrite');
    const store = transaction.objectStore('persons');
    const getRequest = store.get(person.id);
    
    getRequest.onsuccess = function(event) {
        const personToUpdate = event.target.result;
        if (personToUpdate) {
            personToUpdate.currentExamDate = examDate;
            personToUpdate.nextExamDate = nextExamDateStr;
            
            const putRequest = store.put(personToUpdate);
            
            putRequest.onsuccess = function() {
                loadPersons(currentWorkplace.id);
                
                // Ek-2 belgesini masaüstündeki klasöre kaydet
                const fileName = `Ek-2_${person.tc}_${person.name.replace(/\s+/g, '_')}.docx`;
                alert(`Ek-2 belgesi oluşturuldu ve masaüstündeki klasöre kaydedildi:\n\n${fileName}`);
            };
            
            putRequest.onerror = function(event) {
                console.error("Kişi güncellenirken hata:", event.target.error);
            };
        }
    };
    
    getRequest.onerror = function(event) {
        console.error("Kişi bilgisi alınırken hata:", event.target.error);
    };
}

// Ek-2 yükle modalını göster
function showUploadEk2Modal(personId) {
    currentPerson = { id: personId };
    document.getElementById('uploadEk2Modal').style.display = 'block';
    document.getElementById('ek2FileInput').value = '';
}

// Ek-2 yükle modalını gizle
function hideUploadEk2Modal() {
    document.getElementById('uploadEk2Modal').style.display = 'none';
}

// Ek-2 göster modalını göster
function showEk2Documents(personId) {
    // Bu kısım gerçek uygulamada dosya sisteminden okuma yapacaktır
    // Şimdilik simüle ediyoruz
    
    const ek2List = document.getElementById('ek2List');
    ek2List.innerHTML = '';
    
    // Örnek Ek-2 belgeleri
    const exampleFiles = [
        `Ek-2_12345678901_Ahmet_Yılmaz.docx`,
        `Ek-2_98765432109_Ayşe_Demir.docx`
    ];
    
    exampleFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'ek2-item';
        fileItem.textContent = file;
        fileItem.addEventListener('click', function() {
            alert(`${file} belgesi açılıyor...`);
        });
        ek2List.appendChild(fileItem);
    });
    
    document.getElementById('showEk2Modal').style.display = 'block';
}

// Ek-2 göster modalını gizle
function hideShowEk2Modal() {
    document.getElementById('showEk2Modal').style.display = 'none';
}

// Excel'den veri al
function importFromExcel() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // İlk sayfayı al
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length > 0 && currentWorkplace) {
                const transaction = db.transaction(['persons'], 'readwrite');
                const store = transaction.objectStore('persons');
                
                jsonData.forEach(row => {
                    if (row['TC Kimlik No'] && row['İsim Soyisim']) {
                        const person = {
                            workplaceId: currentWorkplace.id,
                            tc: row['TC Kimlik No'].toString(),
                            name: row['İsim Soyisim'],
                            currentExamDate: row['Mevcut Muayene Tarihi'] || '',
                            nextExamDate: row['Sonraki Muayene Tarihi'] || ''
                        };
                        
                        store.add(person);
                    }
                });
                
                transaction.oncomplete = function() {
                    alert("Excel'den veri başarıyla alındı.");
                    loadPersons(currentWorkplace.id);
                };
                
                transaction.onerror = function(event) {
                    console.error("Excel'den veri alınırken hata:", event.target.error);
                    alert("Excel'den veri alınırken hata oluştu.");
                };
            }
        };
        
        reader.readAsArrayBuffer(file);
    };
    
    input.click();
}

// Excel'e veri aktar
function exportToExcel() {
    if (!db || !currentWorkplace) return;
    
    const transaction = db.transaction(['persons'], 'readonly');
    const store = transaction.objectStore('persons');
    const index = store.index('workplaceId');
    const request = index.getAll(IDBKeyRange.only(parseInt(currentWorkplace.id)));
    
    request.onsuccess = function(event) {
        const persons = event.target.result;
        
        // Excel verisi oluştur
        const excelData = persons.map(person => ({
            'TC Kimlik No': person.tc,
            'İsim Soyisim': person.name,
            'Mevcut Muayene Tarihi': person.currentExamDate,
            'Sonraki Muayene Tarihi': person.nextExamDate
        }));
        
        // Çalışma sayfası oluştur
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Kişi Listesi');
        
        // Excel dosyasını indir
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `${currentWorkplace.name}_Kişi_Listesi.xlsx`;
        saveAs(blob, fileName);
    };
    
    request.onerror = function(event) {
        console.error("Excel'e veri aktarılırken hata:", event.target.error);
        alert("Excel'e veri aktarılırken hata oluştu.");
    };
}

// Yedek oluştur
function createBackup() {
    if (!db) return;
    
    // Tüm verileri al
    Promise.all([
        getAllData('workplaces'),
        getAllData('persons'),
        getAllData('doctorInfo')
    ]).then(results => {
        const backupData = {
            workplaces: results[0],
            persons: results[1],
            doctorInfo: results[2]
        };
        
        // JSON dosyası oluştur ve indir
        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const fileName = `IsyeriHekimiYedek_${new Date().toISOString().slice(0, 10)}.json`;
        saveAs(blob, fileName);
        
        alert("Yedek başarıyla alındı.");
    }).catch(error => {
        console.error("Yedek alınırken hata:", error);
        alert("Yedek alınırken hata oluştu.");
    });
}

// Yedekten dön
function restoreFromBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (confirm("Yedekten dönmek istediğinize emin misiniz? Mevcut verileriniz silinecektir.")) {
                    // Tüm verileri sil
                    clearDatabase().then(() => {
                        // Yedek verileri yükle
                        return Promise.all([
                            addAllData('workplaces', backupData.workplaces),
                            addAllData('persons', backupData.persons),
                            addAllData('doctorInfo', backupData.doctorInfo)
                        ]);
                    }).then(() => {
                        alert("Yedek başarıyla yüklendi.");
                        loadWorkplaces();
                        loadDoctorInfo();
                    }).catch(error => {
                        console.error("Yedek yüklenirken hata:", error);
                        alert("Yedek yüklenirken hata oluştu.");
                    });
                }
            } catch (error) {
                console.error("Yedek dosyası okunurken hata:", error);
                alert("Geçersiz yedek dosyası.");
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Tüm verileri sil
function clearDatabase() {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Veritabanı bağlantısı yok.");
        
        const transaction = db.transaction(['workplaces', 'persons', 'doctorInfo'], 'readwrite');
        
        transaction.objectStore('workplaces').clear();
        transaction.objectStore('persons').clear();
        transaction.objectStore('doctorInfo').clear();
        
        transaction.oncomplete = function() {
            resolve();
        };
        
        transaction.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Tüm verileri al
function getAllData(storeName) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Veritabanı bağlantısı yok.");
        
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = function() {
            resolve(request.result);
        };
        
        request.onerror = function(event) {
            reject(event.target.error);
        };
    });
}

// Tüm verileri ekle
function addAllData(storeName, data) {
    return new Promise((resolve, reject) => {
        if (!db) return reject("Veritabanı bağlantısı yok.");
        
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        data.forEach(item => {
            store.add(item);
        });
        
        transaction.oncomplete = function() {
            resolve();
        };
        
        transaction.onerror = function(event) {
            reject(event.target.error);
        };
    });
}
