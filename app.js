// GLOBAL STATE MACHINE FOR SIMULATOR
const STATE = {
    user: {
        isCertified: false,
        role: 'user_biasa', // Matches globalRoleSelect
        name: 'Budi Santoso',
        avatar: 'BS'
    },
    balances: {
        farmer: 0,
        investor: 50000000, // Starts with 50M DANA wallet
        driver: 0,
        adminFee: 0,
        b2bBudget: 150000000 // B2B factory starting fund
    },
    // Seed database of active/past agricultural projects in Semarang
    projects: [
        {
            id: 'proj-1',
            farmerName: 'Pak Sukardi (Getasan)',
            crop: 'Cabai Merah',
            area: 1500,
            budget: 12000000,
            funded: 12000000,
            status: 'growing', // pending_approval, pending_funding, growing, ready_to_harvest, harvested_at_hub, payout_done
            yieldEst: 1.5, // Tons
            risk: 'Rendah (A+)',
            closedLoopStep: 2, // 1: Money, 2: Physical inputs, 3: Growing/Crops
            karsaLogs: [
                { time: '24 Mei, 09:30', tag: 'INFO', text: 'Karsa Lapor: Penaburan pupuk organik dasar telah selesai di blok A.' },
                { time: '24 Mei, 15:45', tag: 'SENSOR', text: 'Karsa Lapor: Kelembaban sensor A1 normal di 45%, tanah subur.' }
            ],
            forwardPrice: 24000, // Price lock per kg
            totalSale: 0
        },
        {
            id: 'proj-2',
            farmerName: 'Pak Jumadi (Bandungan)',
            crop: 'Tomat Beef',
            area: 1200,
            budget: 8500000,
            funded: 0,
            status: 'pending_funding',
            yieldEst: 2.1, // Tons
            risk: 'Sedang (B)',
            closedLoopStep: 0,
            karsaLogs: [],
            forwardPrice: 12000,
            totalSale: 0
        }
    ],
    b2bDemands: [
        {
            id: 'dem-1',
            company: 'PT Indofood CBP Semarang',
            crop: 'Cabai Merah',
            volume: 5.0, // Tons
            priceLock: 24000,
            status: 'Tercukupi (Forward Contract)'
        }
    ],
    logisticsJobs: [],
    notifications: []
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    // Render Pitch Sizing Charts
    initMarketChart();
    
    // Initial Render of data
    renderAllPanels();
    
    // Push initial status alert
    pushSimNotification('Sistem Siap', 'Selamat datang di Simulator JejakDaya! Ganti role untuk melihat alur hulu-ke-hilir.', 'success');
});

// VIEW SWITCHING (Pitch vs Simulator)
function switchView(viewName) {
    const pitchView = document.getElementById('pitchView');
    const portalView = document.getElementById('portalView');
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => item.classList.remove('active'));

    if (viewName === 'pitch') {
        pitchView.classList.remove('d-none');
        portalView.classList.add('d-none');
        navItems[0].classList.add('active');
    } else {
        pitchView.classList.add('d-none');
        portalView.classList.remove('d-none');
        navItems[1].classList.add('active');
        // Initial setup for portal
        selectRole(STATE.user.role);
    }
}

// ROLE CONTROL PANEL SWAPPING
function changeGlobalRole(roleVal) {
    STATE.user.role = roleVal;
    
    // Sync UI elements
    const sideButtons = document.querySelectorAll('.sidebar-link');
    sideButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.id === `side-${roleVal}`) {
            btn.classList.add('active');
        }
    });

    // Update Avatar Meta Info
    const simAvatar = document.getElementById('simAvatar');
    const simUserName = document.getElementById('simUserName');
    const simUserRole = document.getElementById('simUserRole');
    const portalTitle = document.getElementById('portalTitle');
    const portalDesc = document.getElementById('portalDesc');

    if (roleVal === 'user_biasa') {
        STATE.user.name = 'Budi Santoso';
        STATE.user.avatar = 'BS';
        simUserRole.innerText = 'User Biasa (Academy)';
        portalTitle.innerText = 'Smart Farming Academy';
        portalDesc.innerText = 'Belajar materi agroteknologi, ikuti kuis, dan dapatkan sertifikasi gratis.';
    } else if (roleVal === 'petani') {
        STATE.user.name = STATE.user.isCertified ? 'Budi Santoso (Agri-Preneur)' : 'Pak Tani Budi';
        STATE.user.avatar = 'AP';
        simUserRole.innerText = 'Agri-Preneur (Petani)';
        portalTitle.innerText = 'Portal Agri-Preneur';
        portalDesc.innerText = 'Kelola lahan tanam, pantau telemetri IoT, catat jurnal via Karsa AI.';
    } else if (roleVal === 'investor') {
        STATE.user.name = 'Hendra Wijaya (Premium)';
        STATE.user.avatar = 'HW';
        simUserRole.innerText = 'Investor Komunitas';
        portalTitle.innerText = 'Portal Investor Komunitas';
        portalDesc.innerText = 'Dukung ketahanan pangan melalui closed-loop crowdfunding dengan bagi hasil transparan.';
    } else if (roleVal === 'b2b') {
        STATE.user.name = 'Mega (PT Sinar Rasa)';
        STATE.user.avatar = 'B2B';
        simUserRole.innerText = 'Pembeli B2B (Enterprise)';
        portalTitle.innerText = 'Portal Pembeli B2B / Pabrik';
        portalDesc.innerText = 'Kelola pasokan bahan baku stabil secara berkala dengan Forward Contract.';
    } else if (roleVal === 'driver') {
        STATE.user.name = 'Joko Susilo (Pikap)';
        STATE.user.avatar = 'JS';
        simUserRole.innerText = 'Mitra Logistik (Driver)';
        portalTitle.innerText = 'Logistik Ride-Hailing';
        portalDesc.innerText = 'Ambil order angkutan pasokan komoditas tani dari Getasan/Bandungan Hub ke pabrik.';
    } else if (roleVal === 'admin') {
        STATE.user.name = 'Tim Kurator JejakDaya';
        STATE.user.avatar = 'JD';
        simUserRole.innerText = 'Admin Platform';
        portalTitle.innerText = 'Console Admin & Hub Quality Control';
        portalDesc.innerText = 'Verifikasi pengajuan lahan, sortir mutu sayur di stasiun Hub, & otorisasi pembayaran bagi hasil.';
    }

    simAvatar.innerText = STATE.user.avatar;
    simUserName.innerText = STATE.user.name;

    // Show/Hide active panel
    const panels = document.querySelectorAll('.sim-panel');
    panels.forEach(p => p.classList.add('d-none'));
    
    const activePanel = document.getElementById(`panel-${roleVal}`);
    if (activePanel) {
        activePanel.classList.remove('d-none');
    }

    // Sync dropdown value in header
    document.getElementById('globalRoleSelect').value = roleVal;
    
    renderAllPanels();
}

function selectRole(roleVal) {
    changeGlobalRole(roleVal);
}

// -------------------------------------------------------------
// RENDER STATIONS FOR EACH SIM PANEL
// -------------------------------------------------------------
function renderAllPanels() {
    renderUserBiasaPanel();
    renderPetaniPanel();
    renderInvestorPanel();
    renderB2BPanel();
    renderDriverPanel();
    renderAdminPanel();
}

// 1. USER BIASA (ACADEMY) RENDER
function renderUserBiasaPanel() {
    const certCard = document.getElementById('certCard');
    if (STATE.user.isCertified) {
        certCard.classList.remove('d-none');
        certCard.innerHTML = `
            <h4 style="color: var(--primary);"><i class="fa-solid fa-circle-check"></i> Sudah Bersertifikat</h4>
            <p class="mt-2 text-muted" style="font-size: 0.8rem;">Anda telah lulus akademi hortikultura modern JejakDaya.</p>
            <div class="glass-card mt-4 p-4" style="padding: 1rem; border-color: var(--primary); background: rgba(16,185,129,0.02)">
                <i class="fa-solid fa-medal" style="font-size: 2rem; color: var(--accent); margin-bottom: 0.5rem; display:block;"></i>
                <strong style="font-family: var(--font-header)">AGRI-PRENEUR VERIFIED</strong>
                <p style="font-size:0.7rem; color: var(--text-muted)">ID: JD-JATENG-2026</p>
            </div>
        `;
    }
}

// 2. PETANI (AGRI-PRENEUR) RENDER
function renderPetaniPanel() {
    // Header telemetry states
    document.getElementById('farmerWallet').innerText = formatIDR(STATE.balances.farmer);
    
    // Find if current user has projects
    const myProjects = STATE.projects.filter(p => p.farmerName.includes('Budi Santoso') || p.farmerName.includes('Pak Tani Budi'));
    const farmerActiveProjectCard = document.getElementById('farmerActiveProjectCard');
    
    if (myProjects.length === 0) {
        farmerActiveProjectCard.innerHTML = `<div class="text-center text-muted">Belum ada proyek tanam aktif. Gunakan form di atas untuk mengajukan pendanaan.</div>`;
        document.getElementById('farmerHarvestVal').innerText = 'Rp0';
        document.getElementById('farmerGoodsStatus').innerText = 'N/A';
        document.getElementById('farmerGoodsDesc').innerText = 'Belum ada pendanaan aktif';
    } else {
        let content = '';
        myProjects.forEach(p => {
            let badgeClass = 'badge-warning';
            let statusText = 'Verifikasi AI';
            let simulatedHarvestBtn = '';
            
            if (p.status === 'pending_approval') {
                badgeClass = 'badge-warning';
                statusText = 'Verifikasi AI Pengelola';
            } else if (p.status === 'pending_funding') {
                badgeClass = 'badge-info';
                statusText = 'Menunggu Investor';
            } else if (p.status === 'growing') {
                badgeClass = 'badge-success';
                statusText = 'Fase Tumbuh';
                simulatedHarvestBtn = `<button class="btn btn-secondary mt-2" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="triggerHarvest('${p.id}')">Simulasikan Panen <i class="fa-solid fa-basket-shopping"></i></button>`;
            } else if (p.status === 'ready_to_harvest') {
                badgeClass = 'badge-success';
                statusText = 'Siap Panen';
                simulatedHarvestBtn = `<button class="btn btn-primary mt-2" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="triggerHarvest('${p.id}')">Panen Sayur ke Hub <i class="fa-solid fa-truck-ramp-box"></i></button>`;
            } else if (p.status === 'harvested_at_hub') {
                badgeClass = 'badge-info';
                statusText = 'Berada di Hub (QC)';
            } else if (p.status === 'payout_done') {
                badgeClass = 'badge-success';
                statusText = 'Pembagian Selesai';
            }

            // Closed loop goods descriptions
            let physicalInputs = 'Belum dikirim';
            let physicalDesc = 'Belum ada investasi masuk';
            if (p.closedLoopStep >= 1) {
                physicalInputs = 'Terdistribusi';
                physicalDesc = 'Bibit unggul & pupuk kandang dikirim ke lahan';
                document.getElementById('farmerGoodsStatus').innerText = 'TERKIRIM';
                document.getElementById('farmerGoodsStatus').className = 'stat-widget-val change-up';
                document.getElementById('farmerGoodsDesc').innerText = 'Fisik input benih & pupuk di lahan';
            }

            document.getElementById('farmerHarvestVal').innerText = formatIDR(p.area * 15000); // 15k est cost

            content += `
                <div class="glass-card p-4 mt-2" style="padding: 1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;" class="mb-2">
                        <strong>${p.crop} (${p.area} m²)</strong>
                        <span class="badge ${badgeClass}">${statusText}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size: 0.8rem;" class="text-muted mb-2">
                        <span>Target Dana: ${formatIDR(p.budget)}</span>
                        <span>Estimasi Hasil: ${p.yieldEst} Ton</span>
                    </div>
                    <div class="project-progress">
                        <div class="project-progress-bar" style="width: ${p.funded >= p.budget ? '100%' : '30%'}; background: var(--primary);"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;" class="mt-2">
                        <span style="font-size: 0.75rem;" class="text-muted"><i class="fa-solid fa-box-open"></i> LogistikClosed-Loop: <strong>${physicalInputs}</strong></span>
                        ${simulatedHarvestBtn}
                    </div>
                </div>
            `;
        });
        farmerActiveProjectCard.innerHTML = content;
    }
}

// 3. INVESTOR PORTAL RENDER
let kycStep = 0; // 0 = unverified, 3 = premium verif
function renderInvestorPanel() {
    const kycRequirementArea = document.getElementById('kycRequirementArea');
    const investorMainArea = document.getElementById('investorMainArea');

    if (kycStep < 3) {
        kycRequirementArea.classList.remove('d-none');
        investorMainArea.classList.add('d-none');
    } else {
        kycRequirementArea.classList.add('d-none');
        investorMainArea.classList.remove('d-none');

        // Wallets
        document.getElementById('investorWallet').innerText = formatIDR(STATE.balances.investor);
        
        // Active investments & yields calculations
        const fundedProjects = STATE.projects.filter(p => p.funded > 0 && p.farmerName.includes('Budi'));
        let activeAmt = 0;
        let profitEst = 0;
        fundedProjects.forEach(p => {
            activeAmt += p.budget;
            profitEst += p.budget * 0.15; // 15% estimated profit
        });

        document.getElementById('investorActiveAmt').innerText = formatIDR(activeAmt);
        document.getElementById('investorProfitVal').innerText = formatIDR(profitEst);

        // Catalog of projects needing funds
        const investorCatalog = document.getElementById('investorCatalog');
        const openProjects = STATE.projects.filter(p => p.status === 'pending_funding');

        if (openProjects.length === 0) {
            investorCatalog.innerHTML = `<div class="text-center text-muted" style="grid-column: span 2; padding: 2rem;">Belum ada pengajuan lahan baru yang membutuhkan pendanaan.</div>`;
        } else {
            let content = '';
            openProjects.forEach(p => {
                content += `
                    <div class="glass-card project-card p-4">
                        <div class="project-img">
                            <i class="fa-solid fa-leaf"></i>
                            <div class="project-img-label">${p.crop}</div>
                        </div>
                        <h4 class="project-title">${p.crop} - ${p.farmerName}</h4>
                        <div class="project-meta-row">
                            <span>Lahan: ${p.area} m²</span>
                            <span>Tingkat Risiko: <strong>${p.risk}</strong></span>
                        </div>
                        <div class="project-meta-row">
                            <span>Target: <strong>${formatIDR(p.budget)}</strong></span>
                            <span>Hasil Est: ${p.yieldEst} Ton</span>
                        </div>
                        <div class="project-progress mb-4">
                            <div class="project-progress-bar" style="width: 0%;"></div>
                        </div>
                        <button class="btn btn-primary btn-sm" style="font-size:0.8rem; padding: 0.5rem;" onclick="fundProject('${p.id}')">
                            Danai Lahan Sekarang <i class="fa-solid fa-circle-dollar-to-slot"></i>
                        </button>
                    </div>
                `;
            });
            investorCatalog.innerHTML = content;
        }

        // Closed loop visualizer states
        const activeFund = STATE.projects.find(p => p.funded > 0);
        const trackerStatus = document.getElementById('investorGeoStatus');
        
        // Reset steps classes
        document.querySelectorAll('.loop-step').forEach(step => step.classList.remove('active'));

        if (activeFund) {
            if (activeFund.closedLoopStep === 1) {
                document.getElementById('loop-step-1').classList.add('active');
                trackerStatus.innerHTML = `
                    <div class="badge badge-warning mb-2">Dana Berubah Barang</div>
                    <p style="font-size: 0.8rem;">Otorisasi Platform: Rp${formatNumber(activeFund.budget)} disalurkan ke produsen agro dalam bentuk benih hortikultura premium, siap dikirim via kurir logistik.</p>
                `;
            } else if (activeFund.closedLoopStep === 2) {
                document.getElementById('loop-step-2').classList.add('active');
                
                let journalContent = '';
                if (activeFund.karsaLogs.length > 0) {
                    journalContent = `<strong>Log Karsa Petani Terbaru:</strong><br><span style="color:var(--primary)">"${activeFund.karsaLogs[activeFund.karsaLogs.length - 1].text}"</span>`;
                } else {
                    journalContent = '<em>Belum ada jurnal laporan harian hulu.</em>';
                }

                trackerStatus.innerHTML = `
                    <div class="badge badge-info mb-2"><i class="fa-solid fa-truck-moving"></i> Benih Sampai di Getasan</div>
                    <p style="font-size: 0.8rem; margin-bottom: 0.5rem;">Fisik input (bibit/pupuk) telah lolos kurasi check dan ditransaksikan langsung di lahan petani.</p>
                    <div style="font-size:0.75rem; text-align:left; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px;">
                        ${journalContent}
                    </div>
                `;
            } else if (activeFund.closedLoopStep === 3) {
                document.getElementById('loop-step-3').classList.add('active');
                trackerStatus.innerHTML = `
                    <div class="badge badge-success mb-2"><i class="fa-solid fa-wheat-awn-circle-exclamation"></i> Tanaman Siap Panen</div>
                    <p style="font-size: 0.8rem;">Penyortiran kualitas Grade A/B/C di stasiun JejakDaya Hub Bandungan siap dilaksanakan untuk diantarkan langsung ke pembeli kontrak.</p>
                `;
            }
        }
    }
}

// 4. PEMBELI B2B (ENTERPRISE) RENDER
function renderB2BPanel() {
    const contractsTable = document.getElementById('b2bContractsTable');
    if (STATE.b2bDemands.length === 0) {
        contractsTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">Belum ada kontrak pengadaan aktif. Gunakan form di atas.</td></tr>`;
    } else {
        let content = '';
        STATE.b2bDemands.forEach(d => {
            content += `
                <tr>
                    <td><strong>${d.crop}</strong></td>
                    <td>${d.volume} Ton</td>
                    <td>${formatIDR(d.priceLock)}/Kg</td>
                    <td><strong>${formatIDR(d.volume * 1000 * d.priceLock)}</strong></td>
                    <td><span class="badge badge-success">${d.status}</span></td>
                </tr>
            `;
        });
        contractsTable.innerHTML = content;
    }

    // Smart Match logic
    const b2bMatchWidget = document.getElementById('b2bMatchWidget');
    if (STATE.b2bDemands.length > 0) {
        const targetDemand = STATE.b2bDemands[STATE.b2bDemands.length - 1];
        // Read yield capability from state database
        const matchingCrops = STATE.projects.filter(p => p.crop === targetDemand.crop && p.status !== 'pending_approval');
        let matchedYield = 0;
        matchingCrops.forEach(p => matchedYield += p.yieldEst);

        if (matchingCrops.length > 0) {
            b2bMatchWidget.innerHTML = `
                <div class="glass-card p-4" style="padding: 1rem;">
                    <h4 style="color:var(--primary)" class="mb-2"><i class="fa-solid fa-network-wired"></i> Algoritma Matcher Aktif</h4>
                    <p style="font-size:0.8rem;" class="mb-4">Ditemukan <strong>${matchingCrops.length} Agri-Preneur</strong> di Kabupaten Semarang yang menanam ${targetDemand.crop} dengan taksiran panen kolektif.</p>
                    
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;" class="mb-2">
                        <span>Permintaan B2B:</span>
                        <strong>${targetDemand.volume} Ton</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between; font-size:0.8rem;" class="mb-2">
                        <span>Prediksi Tani Semarang:</span>
                        <strong style="color:var(--primary)">${matchedYield.toFixed(1)} Ton</strong>
                    </div>
                    <div class="project-progress mb-4">
                        <div class="project-progress-bar" style="width: ${(matchedYield / targetDemand.volume * 100).toFixed(0)}%; background: var(--secondary);"></div>
                    </div>
                    
                    <div class="contract-seal">
                        <div class="seal-stamp"><i class="fa-solid fa-stamp"></i></div>
                        <i class="fa-solid fa-file-signature seal-logo"></i>
                        <h5>FORWARD CONTRACT LOCKED</h5>
                        <p class="text-muted mt-2" style="font-size:0.7rem;">Harga Cabai Merah dikunci di <strong>${formatIDR(targetDemand.priceLock)}/Kg</strong> untuk PT Indofood CBP Semarang.</p>
                    </div>
                </div>
            `;
        } else {
            b2bMatchWidget.innerHTML = `
                <div class="glass-card p-4 text-center text-muted" style="padding: 2rem;">
                    <i class="fa-solid fa-magnifying-glass-chart" style="font-size:2rem; color:var(--text-dark); margin-bottom: 0.5rem; display:block;"></i>
                    Mencari petani yang menanam ${targetDemand.crop}... Saat ini pasokan di Semarang belum mencukupi permintaan Anda.
                </div>
            `;
        }
    }
}

// 5. DRIVER (MITRA LOGISTIK) RENDER
function renderDriverPanel() {
    document.getElementById('driverWallet').innerText = formatIDR(STATE.balances.driver);
    const driverQueueArea = document.getElementById('driverQueueArea');
    const queueBadge = document.getElementById('driverQueueBadge');

    const openJobs = STATE.logisticsJobs.filter(j => j.status === 'queued' || j.status === 'delivering');
    queueBadge.innerText = `${openJobs.length} Orderan`;

    if (openJobs.length === 0) {
        driverQueueArea.innerHTML = `
            <div class="text-center text-muted" style="padding: 3rem 1rem;">
                <i class="fa-solid fa-map-location-dot" style="font-size: 2.5rem; margin-bottom: 1rem; display: block;"></i>
                Menunggu proses grading panen dan otorisasi armada logistik oleh Admin.
            </div>
        `;
        document.getElementById('driverMapVisual').innerHTML = `
            <i class="fa-solid fa-map-location" style="font-size: 3rem; color: var(--text-dark); margin-bottom: 1rem;"></i>
            <div class="text-center text-muted" style="font-size: 0.8rem;">Gps logistik offline. Ambil order pengiriman untuk memetakan rute optimal (Getasan Hub - Pabrik).</div>
        `;
    } else {
        let content = '';
        openJobs.forEach(j => {
            let actButton = '';
            if (j.status === 'queued') {
                actButton = `<button class="btn btn-primary btn-sm" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="driverAcceptJob('${j.id}')">Terima Order Angkut <i class="fa-solid fa-circle-check"></i></button>`;
            } else if (j.status === 'delivering') {
                actButton = `<button class="btn btn-success btn-sm" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="driverCompleteJob('${j.id}')">Konfirmasi Tiba di Pabrik <i class="fa-solid fa-location-arrow"></i></button>`;
            }

            content += `
                <div class="glass-card p-4 mt-2" style="padding: 1.25rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;" class="mb-2">
                        <strong>Order #${j.id.toUpperCase()}</strong>
                        <span class="badge ${j.status === 'queued' ? 'badge-warning' : 'badge-info'}">${j.status === 'queued' ? 'Antrian Hub' : 'Sedang Kirim'}</span>
                    </div>
                    <p style="font-size:0.85rem;" class="text-muted mb-2">
                        Kargo: <strong>${j.crop} (Grade ${j.grade})</strong> - ${j.weight} Ton<br>
                        Rute: ${j.from} &rarr; ${j.to}
                    </p>
                    <div style="display:flex; justify-content:space-between; align-items:center;" class="mt-2">
                        <span style="font-size: 0.95rem; color: var(--primary);">Ongkos: <strong>${formatIDR(j.fee)}</strong></span>
                        ${actButton}
                    </div>
                </div>
            `;

            // Render Route visual map
            if (j.status === 'delivering') {
                document.getElementById('driverMapVisual').innerHTML = `
                    <div style="position:absolute; top: 10px; left:10px;" class="badge badge-info"><i class="fa-solid fa-route"></i> LIVE TRACKING</div>
                    <div style="width: 100%; text-align: left; font-size:0.8rem; margin-bottom: 1.5rem;">
                        <strong>Jalur Pengiriman Terpeta:</strong><br>
                        Sentral Hub ${j.from} &rarr; Tol Bawen &rarr; ${j.to}<br>
                        <span style="color:var(--primary);"><i class="fa-solid fa-spinner fa-spin"></i> Truk pengangkut ${j.crop} sedang bergerak...</span>
                    </div>
                    <div style="width: 80%; height: 6px; background: rgba(255,255,255,0.05); border-radius:3px; position:relative; overflow:hidden;">
                        <div style="position:absolute; height:100%; width: 60%; background:var(--primary); animation: logProgress 5s infinite;"></div>
                    </div>
                `;
            }
        });
        driverQueueArea.innerHTML = content;
    }
}

// 6. ADMIN PORTAL RENDER
function renderAdminPanel() {
    // Platform fee counters
    document.getElementById('adminPlatformFee').innerText = formatIDR(STATE.balances.adminFee);
    
    // Total count of pending approval
    const pendingCuration = STATE.projects.filter(p => p.status === 'pending_approval');
    document.getElementById('adminPendingProjects').innerText = `${pendingCuration.length} Proyek`;
    
    const adminProjectQueue = document.getElementById('adminProjectQueue');
    if (pendingCuration.length === 0) {
        adminProjectQueue.innerHTML = `<div class="text-center text-muted" style="padding: 1.5rem;">Tidak ada proyek tani baru yang menunggu persetujuan.</div>`;
    } else {
        let content = '';
        pendingCuration.forEach(p => {
            content += `
                <div class="glass-card p-4 mt-2" style="padding: 1.25rem;">
                    <div style="display:flex; justify-content:space-between;" class="mb-2">
                        <strong>Lahan ${p.crop} - ${p.farmerName}</strong>
                        <span class="badge badge-warning">AI Curation Passed</span>
                    </div>
                    <p style="font-size:0.85rem;" class="text-muted mb-4">
                        Luas: ${p.area} m² | Rencana Dana: ${formatIDR(p.budget)} | Risiko: ${p.risk}
                    </p>
                    <div style="display:flex; justify-content:flex-end; gap: 1rem;">
                        <button class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="adminCurateProject('${p.id}', false)">Tolak</button>
                        <button class="btn btn-primary btn-sm" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="adminCurateProject('${p.id}', true)">Setujui & Publikasikan <i class="fa-solid fa-paper-plane"></i></button>
                    </div>
                </div>
            `;
        });
        adminProjectQueue.innerHTML = content;
    }

    // Quality gatekeeping QC station
    const qcAwaiting = STATE.projects.filter(p => p.status === 'harvested_at_hub');
    const adminHubQCQueue = document.getElementById('adminHubQCQueue');
    
    let activeHubWeight = 0;
    qcAwaiting.forEach(p => activeHubWeight += p.yieldEst);
    document.getElementById('adminHubVolume').innerText = `${activeHubWeight.toFixed(1)} Ton`;

    if (qcAwaiting.length === 0) {
        adminHubQCQueue.innerHTML = `<div class="text-center text-muted" style="padding: 1.5rem;">Tidak ada komoditas panen di stasiun Hub yang mengantri Quality Control.</div>`;
    } else {
        let content = '';
        qcAwaiting.forEach(p => {
            content += `
                <div class="glass-card p-4 mt-2" style="padding: 1.25rem;">
                    <div style="display:flex; justify-content:space-between;" class="mb-2">
                        <strong>Batch Sayur: ${p.crop}</strong>
                        <span>Petani: ${p.farmerName}</span>
                    </div>
                    <p style="font-size:0.85rem;" class="text-muted mb-4">
                        Timbangan Masuk Hub: <strong>${p.yieldEst} Ton</strong> (100% Cocok)
                    </p>
                    
                    <div style="display:flex; gap: 1rem; align-items:center;" class="mb-4">
                        <label style="font-size:0.8rem;" class="text-muted">Grade QC Sayur:</label>
                        <select class="form-control select-control" id="qcGradeSelect-${p.id}" style="width: 150px; font-size:0.8rem; padding: 0.25rem 0.5rem;" onchange="updateAdminRouteVisual('${p.id}', this.value)">
                            <option value="A">Grade A (Premium)</option>
                            <option value="B">Grade B (Medium)</option>
                            <option value="C">Grade C (Lokal)</option>
                        </select>
                    </div>

                    <div style="display:flex; justify-content:flex-end;">
                        <button class="btn btn-primary btn-sm" style="font-size:0.75rem; padding: 0.4rem 1rem;" onclick="adminRouteShipment('${p.id}')">
                            Proses 3-Tier Sales Routing & Kirim <i class="fa-solid fa-network-wired"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        adminHubQCQueue.innerHTML = content;
    }

    // Update forward contract unit
    document.getElementById('adminContractCount').innerText = `${STATE.b2bDemands.length} Kontrak`;
}

// Dynamic routing active map indicator helper
function updateAdminRouteVisual(projId, gradeVal) {
    // Reset highlights
    document.querySelectorAll('.tier-item').forEach(item => item.classList.remove('active'));

    if (gradeVal === 'A') {
        document.getElementById('tier-1-route').classList.add('active');
    } else if (gradeVal === 'B') {
        document.getElementById('tier-2-route').classList.add('active');
    } else if (gradeVal === 'C') {
        document.getElementById('tier-3-route').classList.add('active');
    }
}

// -------------------------------------------------------------
// USER ACTIONS INTERFACE IMPLEMENTATION
// -------------------------------------------------------------

// Academy Quiz
let selectedQuizOpt = null;
function selectQuizOption(element, optionNum) {
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(opt => opt.classList.remove('selected'));
    
    element.classList.add('selected');
    selectedQuizOpt = optionNum;
}

function submitAcademyQuiz() {
    if (!selectedQuizOpt) {
        pushSimNotification('Perhatian', 'Pilih salah satu jawaban kuis terlebih dahulu.', 'info');
        return;
    }

    if (selectedQuizOpt === 2) {
        pushSimNotification('Jawaban Benar!', 'Anda memahami konsep Forward Contract dengan baik. Sertifikat Kelulusan Unlocked!', 'success');
        document.getElementById('certCard').classList.remove('d-none');
        renderUserBiasaPanel();
    } else {
        pushSimNotification('Jawaban Salah', 'Coba lagi! Ingat bahwa forward contract bertujuan menstabilkan harga bagi kedua belah pihak.', 'info');
    }
}

function upgradeToFarmer() {
    STATE.user.isCertified = true;
    STATE.user.role = 'petani';
    
    pushSimNotification('Selamat!', 'Akun Anda berhasil di-upgrade menjadi Agri-Preneur. Sekarang Anda bisa mengajukan pendanaan lahan.', 'success');
    
    // Switch role display
    changeGlobalRole('petani');
}

// Farmers propose funding
function proposeProject(event) {
    event.preventDefault();

    const crop = document.getElementById('formCrop').value;
    const area = parseFloat(document.getElementById('formArea').value);
    const budget = parseFloat(document.getElementById('formBudget').value);

    const newProjId = `proj-${Date.now()}`;
    const newProject = {
        id: newProjId,
        farmerName: STATE.user.name,
        crop: crop,
        area: area,
        budget: budget,
        funded: 0,
        status: 'pending_approval',
        yieldEst: parseFloat((area * 0.0015).toFixed(1)), // Estimated yield based on area
        risk: 'Rendah (A+)',
        closedLoopStep: 0,
        karsaLogs: [],
        forwardPrice: crop === 'Cabai Merah' ? 24000 : crop === 'Tomat Beef' ? 12000 : 8000,
        totalSale: 0
    };

    // Fast AI validation mockup loading
    pushSimNotification('AI Validation', 'Karsa AI sedang mencocokkan kelayakan historis lahan dan data cuaca Kabupaten Semarang...', 'info');

    setTimeout(() => {
        STATE.projects.push(newProject);
        pushSimNotification('AI Curation Lolos', 'Pengajuan lahan disetujui sistem AI. Menunggu konfirmasi otorisasi Admin Pengelola.', 'success');
        
        // Reset form
        document.getElementById('projectForm').reset();
        
        renderAllPanels();
    }, 1500);
}

// AI Voice Assistant "Karsa" Simulator
const simulatedFarmerPhrases = [
    "Karsa Lapor: Sensor kelembaban blok timur turun ke 38%. Saluran irigasi tetes diaktifkan otomatis.",
    "Karsa Lapor: Penanganan pasca gulma selesai di blok B. Lahan siap disebar pupuk organik padat.",
    "Karsa Lapor: Hasil pengamatan fisik daun cabai bebas hama ulat daun. Kondisi tanaman tumbuh subur.",
    "Karsa Lapor: Lahan disiram merata. Ph tanah stabil pada angka 6.4 di lereng Gunung Ungaran."
];

function simulateKarsaVoice() {
    const karsaBtn = document.getElementById('karsaBtn');
    const karsaText = document.getElementById('karsaText');

    karsaBtn.classList.add('listening');
    karsaText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mendengarkan ucapan petani tua di sawah...`;

    setTimeout(() => {
        karsaBtn.classList.remove('listening');
        
        // Pick random farmer phrase
        const randomPhrase = simulatedFarmerPhrases[Math.floor(Math.random() * simulatedFarmerPhrases.length)];
        karsaText.innerText = `"${randomPhrase}"`;

        // Sync back to farmer projects
        const myActiveProjects = STATE.projects.filter(p => p.farmerName.includes('Budi') && p.status === 'growing');
        
        if (myActiveProjects.length > 0) {
            const activeProj = myActiveProjects[0];
            const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
            
            const logItem = {
                time: `Hari ini, ${timestamp}`,
                tag: 'Voice AI',
                text: randomPhrase
            };

            activeProj.karsaLogs.push(logItem);
            
            // Re-render
            pushSimNotification('Jurnal Disimpan', 'Rekaman jurnal harian berhasil ditranskrip oleh Karsa AI & terkirim ke panel investor.', 'success');
            
            // Render logs in farmers panel
            renderKarsaLogsList(activeProj);
            renderAllPanels();
        } else {
            pushSimNotification('Belum Ada Lahan Tumbuh', 'Ucapan berhasil ditranskrip, namun Anda tidak memiliki lahan dalam status "Fase Tumbuh" untuk menyimpan jurnal.', 'info');
        }
    }, 2000);
}

function renderKarsaLogsList(project) {
    const karsaLogs = document.getElementById('karsaLogs');
    let content = '';
    project.karsaLogs.forEach(l => {
        content += `
            <div class="voice-log-item">
                <div class="log-meta">
                    <span class="log-tag"><i class="fa-solid fa-microphone-lines"></i> ${l.tag}</span>
                    <span>${l.time}</span>
                </div>
                <div class="log-text">"${l.text}"</div>
            </div>
        `;
    });
    karsaLogs.innerHTML = content;
}

// Farmer triggers crop harvest
function triggerHarvest(projId) {
    const project = STATE.projects.find(p => p.id === projId);
    if (!project) return;

    if (project.status === 'growing') {
        project.status = 'ready_to_harvest';
        pushSimNotification('Lahan Siap', 'Hasil sayuran siap dipanen! Tekan kembali tombol untuk membawa muatan menuju JejakDaya Hub.', 'info');
    } else if (project.status === 'ready_to_harvest') {
        project.status = 'harvested_at_hub';
        project.closedLoopStep = 3; // Harvested
        
        pushSimNotification('Muatan Dikirim', 'Komoditas sayuran telah sampai di stasiun pengumpul JejakDaya Hub Bandungan. Menunggu verifikasi grading mutu.', 'success');
    }
    
    renderAllPanels();
}

// -------------------------------------------------------------
// INVESTOR ACTIONS
// -------------------------------------------------------------
function simulateKYC() {
    const step1 = document.getElementById('kycStep1');
    const step2 = document.getElementById('kycStep2');
    const step3 = document.getElementById('kycStep3');

    pushSimNotification('KYC Checking', 'Membaca data KTP dari server dukcapil...', 'info');
    step1.className = 'kyc-dot-step done';
    step2.className = 'kyc-dot-step active';

    setTimeout(() => {
        pushSimNotification('KYC Facial Scan', 'Mencocokkan biometric wajah dengan database DANA Premium...', 'info');
        step2.className = 'kyc-dot-step done';
        step3.className = 'kyc-dot-step active';

        setTimeout(() => {
            kycStep = 3;
            step3.className = 'kyc-dot-step done';
            pushSimNotification('Premium Unlocked', 'Akun Investor berhasil diverifikasi. Premium Wallet Rp50.000.000 aktif.', 'success');
            renderAllPanels();
        }, 1500);
    }, 1500);
}

function fundProject(projId) {
    const project = STATE.projects.find(p => p.id === projId);
    if (!project) return;

    if (STATE.balances.investor < project.budget) {
        pushSimNotification('Saldo Kurang', 'Saldo DANA Premium Anda tidak mencukupi untuk mendanai proyek ini.', 'danger');
        return;
    }

    // Closed-Loop Crowdfund Transaction
    STATE.balances.investor -= project.budget;
    project.funded = project.budget;
    project.status = 'growing';
    project.closedLoopStep = 1; // Cash locked to goods

    pushSimNotification('Investasi Berhasil', `Dana ${formatIDR(project.budget)} disetujui. Sistem mengonversi dana langsung menjadi Bibit & Pupuk unggul!`, 'success');

    // Simulate physical delivery of goods to farmer
    setTimeout(() => {
        project.closedLoopStep = 2; // Physical inputs dispatched
        pushSimNotification('Logistik Closed-Loop', 'Mitra logistik telah mengirim pupuk & bibit unggul menuju lahan ' + project.farmerName, 'info');
        renderAllPanels();
    }, 2000);

    renderAllPanels();
}

// -------------------------------------------------------------
// B2B ENTERPRISE ACTIONS
// -------------------------------------------------------------
function createB2BDemand(event) {
    event.preventDefault();

    const crop = document.getElementById('b2bCrop').value;
    const volume = parseFloat(document.getElementById('b2bVolume').value);
    const priceLock = parseFloat(document.getElementById('b2bPrice').value);

    // Create contract
    const newContract = {
        id: `dem-${Date.now()}`,
        company: STATE.user.name,
        crop: crop,
        volume: volume,
        priceLock: priceLock,
        status: 'Tercukupi (Forward Contract)'
    };

    STATE.b2bDemands.push(newContract);
    pushSimNotification('Forward Contract Locked', `Kontrak disetujui! Harga ${crop} dikunci pada ${formatIDR(priceLock)}/Kg.`, 'success');

    // Reset form
    document.getElementById('b2bDemandForm').reset();
    
    renderAllPanels();
}

// -------------------------------------------------------------
// LOGISTICS DRIVER ACTIONS
// -------------------------------------------------------------
function driverAcceptJob(jobId) {
    const job = STATE.logisticsJobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'delivering';
    pushSimNotification('Kargo Diangkut', `Order #${jobId.toUpperCase()} diterima. Driver Joko siap mengantar muatan sayur ke pabrik.`, 'info');
    
    renderAllPanels();
}

function driverCompleteJob(jobId) {
    const job = STATE.logisticsJobs.find(j => j.id === jobId);
    if (!job) return;

    job.status = 'delivered';
    STATE.balances.driver += job.fee; // Driver gets paid

    // Update active project payout readiness
    const project = STATE.projects.find(p => p.id === job.projectId);
    if (project) {
        project.status = 'payout_ready';
        project.totalSale = job.weight * 1000 * project.forwardPrice;
    }

    // Clear completed jobs from open driver dashboard
    STATE.logisticsJobs = STATE.logisticsJobs.filter(j => j.id !== jobId);

    pushSimNotification('Pasokan Diterima', `Kargo berhasil tiba di PT Indofood CBP. Saldo pengiriman ${formatIDR(job.fee)} masuk kantong Driver!`, 'success');
    
    renderAllPanels();
}

// -------------------------------------------------------------
// ADMIN ACTIONS
// -------------------------------------------------------------
function adminCurateProject(projId, isApproved) {
    const project = STATE.projects.find(p => p.id === projId);
    if (!project) return;

    if (isApproved) {
        project.status = 'pending_funding';
        pushSimNotification('Proyek Dipublikasi', `Pengajuan ${project.crop} disetujui admin dan dirilis ke halaman investasi closed-loop.`, 'success');
    } else {
        STATE.projects = STATE.projects.filter(p => p.id !== projId);
        pushSimNotification('Proyek Ditolak', 'Pengajuan proyek gagal kurasi kelayakan lahan.', 'info');
    }

    renderAllPanels();
}

function adminRouteShipment(projId) {
    const project = STATE.projects.find(p => p.id === projId);
    if (!project) return;

    const gradeVal = document.getElementById(`qcGradeSelect-${projId}`).value;
    
    // Create new Logistics Job
    const newJobId = `job-${Date.now().toString().slice(-4)}`;
    
    let destination = 'Pasar Induk Johar';
    let logisticFee = 250000; // Local
    
    if (gradeVal === 'A') {
        destination = 'PT Indofood CBP Semarang (Enterprise)';
        logisticFee = 750000;
    } else if (gradeVal === 'B') {
        destination = 'Restoran Hotel Semarang (Horeka)';
        logisticFee = 450000;
    }

    const newJob = {
        id: newJobId,
        projectId: projId,
        crop: project.crop,
        grade: gradeVal,
        weight: project.yieldEst,
        from: 'Getasan Hub',
        to: destination,
        fee: logisticFee,
        status: 'queued'
    };

    STATE.logisticsJobs.push(newJob);
    
    // Highlight route visualizer
    updateAdminRouteVisual(projId, gradeVal);

    // Remove from QC stasiun
    project.status = 'delivering_to_destination';

    pushSimNotification('Logistik Terjadwal', `Sistem 3-Tier Routing mengalokasikan Grade ${gradeVal} menuju ${destination}. Armada logistik driver dipanggil.`, 'success');
    
    // Simulate automatic B2B payout release once logistics matches B2B
    setTimeout(() => {
        // Trigger payouts automatically or manually
        triggerSplitPayout(project);
    }, 4000);

    renderAllPanels();
}

function triggerSplitPayout(project) {
    // If contract exists, lock totals
    const saleTotal = project.yieldEst * 1000 * project.forwardPrice;
    
    // Splits: 60% farmer, 35% investor, 5% Platform
    const farmerEarn = saleTotal * 0.60;
    const investorEarn = saleTotal * 0.35 + project.budget; // Return Principal + 35% profit share
    const adminFeeEarn = saleTotal * 0.05;

    // Distribute
    STATE.balances.farmer += farmerEarn;
    STATE.balances.investor += investorEarn;
    STATE.balances.adminFee += adminFeeEarn;
    
    project.status = 'payout_done';

    pushSimNotification('Payout Gateway Sukses', `Split payout diproses: Petani (+${formatIDR(farmerEarn)}), Investor (+${formatIDR(investorEarn)}), Platform (+${formatIDR(adminFeeEarn)}).`, 'success');
    
    renderAllPanels();
}

// -------------------------------------------------------------
// CORE UTILITIES & PLOTTERS
// -------------------------------------------------------------

// Sleek Circular chart for market sizing
function initMarketChart() {
    const ctx = document.getElementById('marketChart');
    if (!ctx) return;

    // SOM 3-district details in Semarang Regency
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Kec. Bandungan (40%)', 'Kec. Getasan (35%)', 'Kec. Sumowono (25%)'],
            datasets: [{
                label: 'SOM Target (57 Miliar)',
                data: [22.8, 19.9, 14.3],
                backgroundColor: [
                    '#10b981', // Emerald Mint
                    '#3b82f6', // Cyan blue
                    '#f59e0b'  // Orange Amber
                ],
                borderWidth: 2,
                borderColor: '#0d141e'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Formatter Helpers
function formatIDR(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function formatNumber(num) {
    return num.toLocaleString('id-ID');
}

// Toast Notifier
function pushSimNotification(title, text, type = 'info') {
    const notifier = document.getElementById('globalNotifier');
    if (!notifier) return;

    const alert = document.createElement('div');
    alert.className = `sim-alert sim-alert-${type}`;
    
    let iconClass = 'fa-solid fa-circle-info';
    if (type === 'success') iconClass = 'fa-solid fa-circle-check';
    if (type === 'danger') iconClass = 'fa-solid fa-triangle-exclamation';

    alert.innerHTML = `
        <i class="${iconClass}" style="font-size: 1.5rem; color: ${type === 'success' ? 'var(--primary)' : 'var(--secondary)'}"></i>
        <div class="alert-body">
            <h5>${title}</h5>
            <p>${text}</p>
        </div>
    `;

    notifier.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5500);
}
