// Mock data to demonstrate the dashboard
const mockData = {
    students: [{ id: 1, name: 'طالب مثال', status: 'active', balance: 0, groupIds: [1], parentPhone: '01000000000' }],
    groups: [{ id: 1, name: 'مجموعة 1', subject: 'رياضيات', price: 100 }],
    teachers: [{ id: 1, name: 'أ. مثال', subject: 'رياضيات', commissionRate: 100 }],
    payments: [{ id: 1, studentId: 1, studentName: 'طالب مثال', amount: 100, timestamp: new Date().toISOString() }]
};

function renderDashboard(data) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="p-6">
            <h1 class="text-3xl font-bold mb-4">نظرة عامة (مستقل)</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="bg-slate-800 p-4 rounded-xl">
                    <h2 class="text-slate-400">الإيرادات</h2>
                    <p class="text-2xl font-bold">${data.payments.reduce((acc, p) => acc + p.amount, 0)}</p>
                </div>
            </div>
        </div>
    `;
}

renderDashboard(mockData);
