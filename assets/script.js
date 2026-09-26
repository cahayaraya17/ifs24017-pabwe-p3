/**
 * Praktikum 3 - JavaScript
 *
 * Fitur:
 * 1. Expense Tracker
 * 2. Bookmark Manager
 * 3. Quiz App
 *
 * Data fitur (expense, bookmark, quiz high score) disimpan di localStorage.
 * Tab aktif TIDAK disimpan di localStorage — dikelola lewat query URL (?tab=...).
 */


/* =========================================================
   UTILITAS DASAR
   (diletakkan paling atas agar tidak bergantung pada hoisting
   saat dipakai oleh fungsi render di bawah)
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $all(selector) {
    return document.querySelectorAll(selector);
}

function formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

function escapeAttribute(value) {

    return escapeHTML(value);

}

function shuffleArray(array) {

    const result = [...array];

    for (let i = result.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [result[i], result[j]] = [result[j], result[i]];

    }

    return result;
}

function isValidURL(url) {

    return /^https?:\/\//i.test(url);

}


/* =========================================================
   STORAGE HELPER GENERIK
   (dipakai bareng oleh Expense, Bookmark & High Score agar
   tidak duplikasi logika load/save, dan aman dari kegagalan
   localStorage misalnya saat storage penuh)
========================================================= */

function createStorage(key) {

    return {

        load() {

            try {

                const data = localStorage.getItem(key);

                return data ? JSON.parse(data) : [];

            } catch (error) {

                return [];

            }

        },

        save(data) {

            try {

                localStorage.setItem(key, JSON.stringify(data));

            } catch (error) {

                // localStorage gagal (mis. penuh / mode privat) —
                // biarkan UI tetap berjalan meski data tidak tersimpan.

            }

        }

    };

}


/* =========================================================
   VALIDASI HELPER GENERIK
   (dipakai bareng oleh form tambah & form edit, untuk Expense
   maupun Bookmark, agar tidak duplikasi logika validasi)
========================================================= */

function validateExpenseInput({ title, category, amount, date }) {

    if (!title ||
        !category ||
        !date ||
        !Number.isFinite(amount) ||
        amount <= 0) {

        return "Semua field wajib diisi dan jumlah harus lebih dari 0.";

    }

    return null;
}

function validateBookmarkInput({ title, url, category }) {

    if (!title || !url || !category) {

        return "Nama, URL, dan kategori wajib diisi.";

    }

    if (!isValidURL(url)) {

        return "URL harus diawali http:// atau https://.";

    }

    return null;
}


/* =========================================================
   STATE TERPUSAT
   (satu objek app state, menggantikan banyak variabel global
   terpisah, supaya lebih mudah dilacak dan dikelola)
========================================================= */

const appState = {

    expense: {
        items: [],
        editingId: null,
        deletingId: null
    },

    bookmark: {
        items: [],
        editingId: null,
        deletingId: null
    },

    quiz: {
        activeQuestions: [],
        currentQuestion: 0,
        score: 0,
        answered: false
    }

};


/* =========================================================
   TAB NAVIGATION (state dikelola lewat query URL)
========================================================= */

const tabButtons = $all(".tab-btn");

const panels = {
    expense: $("#panel-expense"),
    bookmark: $("#panel-bookmark"),
    quiz: $("#panel-quiz")
};


function getTabFromURL() {

    const params = new URLSearchParams(window.location.search);

    const tab = params.get("tab");

    return panels[tab] ? tab : "expense";

}


function switchTab(tabName, { updateURL = true, method = "push" } = {}) {

    if (!panels[tabName]) {
        tabName = "expense";
    }

    Object.entries(panels).forEach(([name, panel]) => {

        panel.classList.toggle(
            "hidden",
            name !== tabName
        );

    });


    tabButtons.forEach((button) => {

        const active =
            button.dataset.tab === tabName;

        button.setAttribute(
            "aria-selected",
            String(active)
        );

        button.classList.toggle(
            "bg-sky-600",
            active
        );

        button.classList.toggle(
            "text-white",
            active
        );

        button.classList.toggle(
            "bg-white",
            !active
        );

        button.classList.toggle(
            "text-slate-600",
            !active
        );

    });


    if (updateURL) {

        const params = new URLSearchParams(window.location.search);

        params.set("tab", tabName);

        const newURL =
            `${window.location.pathname}?${params.toString()}${window.location.hash}`;

        if (method === "replace") {

            history.replaceState({ tab: tabName }, "", newURL);

        } else {

            history.pushState({ tab: tabName }, "", newURL);

        }

    }

}


tabButtons.forEach((button) => {

    button.addEventListener("click", () => {

        switchTab(button.dataset.tab, { updateURL: true, method: "push" });

    });

});


// Dukung tombol back/forward browser
window.addEventListener("popstate", () => {

    switchTab(getTabFromURL(), { updateURL: false });

});


// Inisialisasi tab dari query URL saat halaman pertama dimuat
// (pakai replaceState agar tidak menambah entry history baru)
switchTab(getTabFromURL(), { updateURL: true, method: "replace" });



/* =========================================================
   EXPENSE TRACKER
========================================================= */

const expenseStorage = createStorage("pabwe-p3-expenses");

appState.expense.items = expenseStorage.load();


/* ---------- DOM Expense ---------- */

const expenseForm = $("#expense-form");

const expenseTitle = $("#expense-title");
const expenseCategory = $("#expense-category");
const expenseAmount = $("#expense-amount");
const expenseType = $("#expense-type");
const expenseDate = $("#expense-date");

const expenseSearch = $("#expense-search");
const expenseFilterType = $("#expense-filter-type");
const expenseSort = $("#expense-sort");

const expenseList = $("#expense-list");
const expenseEmpty = $("#expense-empty");

const totalIncome = $("#total-income");
const totalExpense = $("#total-expense");
const totalBalance = $("#total-balance");


/* ---------- Modal Expense ---------- */

const expenseModal = $("#expense-modal");
const deleteExpenseModal = $("#delete-expense-modal");

const expenseEditForm = $("#expense-edit-form");

const editExpenseId = $("#edit-expense-id");
const editExpenseTitle = $("#edit-expense-title");
const editExpenseCategory = $("#edit-expense-category");
const editExpenseAmount = $("#edit-expense-amount");
const editExpenseType = $("#edit-expense-type");
const editExpenseDate = $("#edit-expense-date");


/* ---------- Ringkasan ---------- */

function updateExpenseSummary() {

    let income = 0;
    let expense = 0;

    appState.expense.items.forEach((item) => {

        if (item.type === "Pemasukan") {

            income += item.amount;

        } else {

            expense += item.amount;

        }

    });


    const balance = income - expense;

    totalIncome.textContent =
        formatRupiah(income);

    totalExpense.textContent =
        formatRupiah(expense);

    totalBalance.textContent =
        formatRupiah(balance);
}


/* ---------- Render Expense ---------- */

function renderExpenses() {

    const search =
        expenseSearch.value
            .trim()
            .toLowerCase();

    const filterType =
        expenseFilterType.value;

    const sort =
        expenseSort.value;


    let items = appState.expense.items.filter((item) => {

        const matchesSearch =
            item.title
                .toLowerCase()
                .includes(search);

        const matchesType =
            filterType === "Semua" ||
            item.type === filterType;

        return matchesSearch && matchesType;

    });


    items.sort((a, b) => {

        if (sort === "oldest") {

            return new Date(a.date) -
                new Date(b.date);

        }

        if (sort === "highest") {

            return b.amount - a.amount;

        }

        if (sort === "lowest") {

            return a.amount - b.amount;

        }

        return new Date(b.date) -
            new Date(a.date);

    });


    expenseList.innerHTML = "";


    if (appState.expense.items.length === 0) {

        expenseEmpty.classList.remove("hidden");

        return;

    }


    expenseEmpty.classList.add("hidden");


    if (items.length === 0) {

        expenseList.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                Tidak ada transaksi yang sesuai.
            </div>
        `;

        return;

    }


    items.forEach((item) => {

        const article =
            document.createElement("article");


        const typeColor =
            item.type === "Pemasukan"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-rose-100 text-rose-700";


        article.className =
            "border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4";


        article.innerHTML = `

            <div class="flex-1">

                <div class="flex items-center gap-2">

                    <h3 class="font-bold">
                        ${escapeHTML(item.title)}
                    </h3>

                    <span
                        class="text-xs px-2 py-1 rounded-full ${typeColor}">
                        ${item.type}
                    </span>

                </div>

                <p class="text-sm text-slate-500 mt-1">
                    ${escapeHTML(item.category)}
                    • ${item.date}
                </p>

            </div>


            <div class="font-bold
                ${item.type === "Pemasukan"
                    ? "text-emerald-600"
                    : "text-rose-600"}">

                ${item.type === "Pemasukan" ? "+" : "-"}
                ${formatRupiah(item.amount)}

            </div>


            <div class="flex gap-2">

                <button
                    type="button"
                    class="edit-expense border px-3 py-1.5 rounded-lg text-sm"
                    data-id="${item.id}">

                    Ubah

                </button>


                <button
                    type="button"
                    class="delete-expense border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg text-sm"
                    data-id="${item.id}">

                    Hapus

                </button>

            </div>

        `;


        expenseList.appendChild(article);

    });

}


/* ---------- Tambah Expense ---------- */

expenseForm.addEventListener("submit", (event) => {

    event.preventDefault();


    const title =
        expenseTitle.value.trim();

    const category =
        expenseCategory.value;

    const amount =
        Number(expenseAmount.value);

    const type =
        expenseType.value;

    const date =
        expenseDate.value;


    const errorMessage =
        validateExpenseInput({ title, category, amount, date });

    if (errorMessage) {

        alert(errorMessage);

        return;

    }


    const newExpense = {

        id: Date.now(),

        title: title,

        category: category,

        amount: amount,

        type: type,

        date: date

    };


    appState.expense.items.push(newExpense);

    expenseStorage.save(appState.expense.items);

    renderExpenses();

    updateExpenseSummary();

    expenseForm.reset();

});


/* ---------- Search / Filter / Sort ---------- */

expenseSearch.addEventListener(
    "input",
    renderExpenses
);

expenseFilterType.addEventListener(
    "change",
    renderExpenses
);

expenseSort.addEventListener(
    "change",
    renderExpenses
);


/* ---------- Klik Ubah / Hapus ---------- */

expenseList.addEventListener("click", (event) => {

    const editButton =
        event.target.closest(".edit-expense");

    const deleteButton =
        event.target.closest(".delete-expense");


    if (editButton) {

        openExpenseEdit(
            Number(editButton.dataset.id)
        );

    }


    if (deleteButton) {

        appState.expense.deletingId =
            Number(deleteButton.dataset.id);

        deleteExpenseModal.classList.remove(
            "hidden"
        );

    }

});


/* ---------- Modal Edit Expense ---------- */

function openExpenseEdit(id) {

    const item =
        appState.expense.items.find(
            (expense) => expense.id === id
        );


    if (!item) {
        return;
    }


    appState.expense.editingId = id;

    editExpenseId.value = id;

    editExpenseTitle.value =
        item.title;

    editExpenseCategory.value =
        item.category;

    editExpenseAmount.value =
        item.amount;

    editExpenseType.value =
        item.type;

    editExpenseDate.value =
        item.date;


    expenseModal.classList.remove(
        "hidden"
    );

}


expenseEditForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const title =
            editExpenseTitle.value.trim();

        const category =
            editExpenseCategory.value;

        const amount =
            Number(editExpenseAmount.value);

        const type =
            editExpenseType.value;

        const date =
            editExpenseDate.value;


        const errorMessage =
            validateExpenseInput({ title, category, amount, date });

        if (errorMessage) {

            alert(errorMessage);

            return;

        }


        const item =
            appState.expense.items.find(
                (expense) =>
                    expense.id === appState.expense.editingId
            );


        if (item) {

            item.title = title;
            item.category = category;
            item.amount = amount;
            item.type = type;
            item.date = date;

        }


        expenseStorage.save(appState.expense.items);

        renderExpenses();

        updateExpenseSummary();

        expenseModal.classList.add(
            "hidden"
        );

    }
);


/* ---------- Tutup Modal Edit ---------- */

$("#cancel-expense-edit")
    .addEventListener("click", () => {

        expenseModal.classList.add(
            "hidden"
        );

    });


/* ---------- Delete Expense ---------- */

$("#cancel-expense-delete")
    .addEventListener("click", () => {

        deleteExpenseModal.classList.add(
            "hidden"
        );

        appState.expense.deletingId = null;

    });


$("#confirm-expense-delete")
    .addEventListener("click", () => {

        appState.expense.items =
            appState.expense.items.filter(
                (item) =>
                    item.id !== appState.expense.deletingId
            );


        expenseStorage.save(appState.expense.items);

        renderExpenses();

        updateExpenseSummary();


        deleteExpenseModal.classList.add(
            "hidden"
        );

        appState.expense.deletingId = null;

    });



/* =========================================================
   BOOKMARK MANAGER
========================================================= */

const bookmarkStorage = createStorage("pabwe-p3-bookmarks");

appState.bookmark.items = bookmarkStorage.load();


/* ---------- DOM Bookmark ---------- */

const bookmarkForm =
    $("#bookmark-form");

const bookmarkTitle =
    $("#bookmark-title");

const bookmarkUrl =
    $("#bookmark-url");

const bookmarkCategory =
    $("#bookmark-category");

const bookmarkNote =
    $("#bookmark-note");

const bookmarkSearch =
    $("#bookmark-search");

const bookmarkSort =
    $("#bookmark-sort");

const bookmarkList =
    $("#bookmark-list");

const bookmarkEmpty =
    $("#bookmark-empty");


/* ---------- Modal Bookmark ---------- */

const bookmarkModal =
    $("#bookmark-modal");

const deleteBookmarkModal =
    $("#delete-bookmark-modal");

const bookmarkEditForm =
    $("#bookmark-edit-form");

const editBookmarkTitle =
    $("#edit-bookmark-title");

const editBookmarkUrl =
    $("#edit-bookmark-url");

const editBookmarkCategory =
    $("#edit-bookmark-category");

const editBookmarkNote =
    $("#edit-bookmark-note");


/* ---------- Render Bookmark ---------- */

function renderBookmarks() {

    const search =
        bookmarkSearch.value
            .trim()
            .toLowerCase();


    const sort =
        bookmarkSort.value;


    let items =
        appState.bookmark.items.filter((item) => {

            return (
                item.title
                    .toLowerCase()
                    .includes(search) ||

                item.url
                    .toLowerCase()
                    .includes(search) ||

                item.category
                    .toLowerCase()
                    .includes(search)
            );

        });


    items.sort((a, b) => {

        if (sort === "title-asc") {

            return a.title.localeCompare(
                b.title,
                "id"
            );

        }

        if (sort === "title-desc") {

            return b.title.localeCompare(
                a.title,
                "id"
            );

        }

        return b.createdAt - a.createdAt;

    });


    bookmarkList.innerHTML = "";


    if (appState.bookmark.items.length === 0) {

        bookmarkEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    bookmarkEmpty.classList.add(
        "hidden"
    );


    if (items.length === 0) {

        bookmarkList.innerHTML = `
            <div class="text-center py-8 text-slate-500">
                Tidak ada bookmark yang sesuai.
            </div>
        `;

        return;

    }


    items.forEach((item) => {

        const article =
            document.createElement("article");


        article.className =
            "border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4";


        article.innerHTML = `

            <div class="flex-1">

                <a
                    href="${escapeAttribute(item.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-lg font-bold text-sky-600 hover:underline">

                    ${escapeHTML(item.title)}

                </a>


                <p class="text-sm text-slate-500 break-all mt-1">
                    ${escapeHTML(item.url)}
                </p>


                <div class="flex flex-wrap gap-2 mt-2">

                    <span class="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                        ${escapeHTML(item.category)}
                    </span>

                </div>


                ${
                    item.note
                    ? `
                    <p class="text-sm mt-2 text-slate-600">
                        ${escapeHTML(item.note)}
                    </p>
                    `
                    : ""
                }

            </div>


            <div class="flex gap-2">

                <button
                    type="button"
                    class="edit-bookmark border px-3 py-1.5 rounded-lg text-sm"
                    data-id="${item.id}">

                    Ubah

                </button>


                <button
                    type="button"
                    class="delete-bookmark border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg text-sm"
                    data-id="${item.id}">

                    Hapus

                </button>

            </div>

        `;


        bookmarkList.appendChild(article);

    });

}


/* ---------- Tambah Bookmark ---------- */

bookmarkForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const title =
            bookmarkTitle.value.trim();

        const url =
            bookmarkUrl.value.trim();

        const category =
            bookmarkCategory.value.trim();

        const note =
            bookmarkNote.value.trim();


        const errorMessage =
            validateBookmarkInput({ title, url, category });

        if (errorMessage) {

            alert(errorMessage);

            return;

        }


        const newBookmark = {

            id: Date.now(),

            title: title,

            url: url,

            category: category,

            note: note,

            createdAt: Date.now()

        };


        appState.bookmark.items.push(newBookmark);

        bookmarkStorage.save(appState.bookmark.items);

        renderBookmarks();

        bookmarkForm.reset();

    }
);


/* ---------- Search / Sort Bookmark ---------- */

bookmarkSearch.addEventListener(
    "input",
    renderBookmarks
);

bookmarkSort.addEventListener(
    "change",
    renderBookmarks
);


/* ---------- Klik Aksi Bookmark ---------- */

bookmarkList.addEventListener(
    "click",
    (event) => {

        const editButton =
            event.target.closest(
                ".edit-bookmark"
            );

        const deleteButton =
            event.target.closest(
                ".delete-bookmark"
            );


        if (editButton) {

            openBookmarkEdit(
                Number(editButton.dataset.id)
            );

        }


        if (deleteButton) {

            appState.bookmark.deletingId =
                Number(deleteButton.dataset.id);

            deleteBookmarkModal.classList.remove(
                "hidden"
            );

        }

    }
);


/* ---------- Edit Bookmark ---------- */

function openBookmarkEdit(id) {

    const item =
        appState.bookmark.items.find(
            (bookmark) =>
                bookmark.id === id
        );


    if (!item) {
        return;
    }


    appState.bookmark.editingId = id;

    editBookmarkTitle.value =
        item.title;

    editBookmarkUrl.value =
        item.url;

    editBookmarkCategory.value =
        item.category;

    editBookmarkNote.value =
        item.note;


    bookmarkModal.classList.remove(
        "hidden"
    );

}


bookmarkEditForm.addEventListener(
    "submit",
    (event) => {

        event.preventDefault();


        const title =
            editBookmarkTitle.value.trim();

        const url =
            editBookmarkUrl.value.trim();

        const category =
            editBookmarkCategory.value.trim();

        const note =
            editBookmarkNote.value.trim();


        const errorMessage =
            validateBookmarkInput({ title, url, category });

        if (errorMessage) {

            alert(errorMessage);

            return;

        }


        const item =
            appState.bookmark.items.find(
                (bookmark) =>
                    bookmark.id === appState.bookmark.editingId
            );


        if (item) {

            item.title = title;
            item.url = url;
            item.category = category;
            item.note = note;

        }


        bookmarkStorage.save(appState.bookmark.items);

        renderBookmarks();

        bookmarkModal.classList.add(
            "hidden"
        );

    }
);


/* ---------- Tutup Edit Bookmark ---------- */

$("#cancel-bookmark-edit")
    .addEventListener("click", () => {

        bookmarkModal.classList.add(
            "hidden"
        );

    });


/* ---------- Delete Bookmark ---------- */

$("#cancel-bookmark-delete")
    .addEventListener("click", () => {

        deleteBookmarkModal.classList.add(
            "hidden"
        );

        appState.bookmark.deletingId = null;

    });


$("#confirm-bookmark-delete")
    .addEventListener(
        "click",
        () => {

            appState.bookmark.items =
                appState.bookmark.items.filter(
                    (item) =>
                        item.id !==
                        appState.bookmark.deletingId
                );


            bookmarkStorage.save(appState.bookmark.items);

            renderBookmarks();


            deleteBookmarkModal.classList.add(
                "hidden"
            );

            appState.bookmark.deletingId = null;

        }
    );



/* =========================================================
   QUIZ APP
========================================================= */

const QUIZ_HIGH_SCORE_KEY =
    "pabwe-p3-quiz-high-score";


// Data soal (posisi jawaban benar di sini tidak penting lagi,
// karena opsi akan diacak tiap kali quiz dimulai — lihat getShuffledQuestions())
const questions = [

    {
        question:
            "Apa fungsi HTML dalam pengembangan web?",

        options: [
            "Mengatur struktur halaman",
            "Mengatur database",
            "Membuat sistem operasi",
            "Mengatur jaringan"
        ],

        answer: 0
    },


    {
        question:
            "Apa fungsi CSS?",

        options: [
            "Mengatur tampilan halaman web",
            "Menyimpan data pengguna",
            "Menjalankan server",
            "Membuat database"
        ],

        answer: 0
    },


    {
        question:
            "Bahasa yang digunakan untuk membuat halaman web menjadi interaktif adalah?",

        options: [
            "JavaScript",
            "SQL",
            "HTML",
            "XML"
        ],

        answer: 0
    },


    {
        question:
            "Method apa yang digunakan untuk menyimpan data ke localStorage?",

        options: [
            "localStorage.setItem()",
            "localStorage.save()",
            "localStorage.store()",
            "localStorage.insert()"
        ],

        answer: 0
    },


    {
        question:
            "Method apa yang digunakan untuk mengambil data dari localStorage?",

        options: [
            "localStorage.getItem()",
            "localStorage.take()",
            "localStorage.readData()",
            "localStorage.fetch()"
        ],

        answer: 0
    }

];


// Mengacak posisi opsi jawaban tiap soal, agar jawaban benar
// tidak selalu berada di index 0 (dipanggil ulang tiap quiz dimulai)
function getShuffledQuestions() {

    return questions.map((item) => {

        const correctText =
            item.options[item.answer];

        const shuffledOptions =
            shuffleArray(item.options);

        return {

            question: item.question,

            options: shuffledOptions,

            answer: shuffledOptions.indexOf(correctText)

        };

    });

}


/* ---------- DOM Quiz ---------- */

const quizStart =
    $("#quiz-start");

const quizQuestion =
    $("#quiz-question");

const quizResult =
    $("#quiz-result");

const startQuiz =
    $("#start-quiz");

const restartQuiz =
    $("#restart-quiz");

const questionText =
    $("#question-text");

const quizNumber =
    $("#quiz-number");

const quizScoreElement =
    $("#quiz-score");

const answerOptions =
    $("#answer-options");

const quizFeedback =
    $("#quiz-feedback");

const nextQuestion =
    $("#next-question");

const finalScore =
    $("#final-score");

const highScoreStart =
    $("#high-score-start");

const highScoreResult =
    $("#high-score-result");


/* ---------- High Score ---------- */

function getHighScore() {

    const raw =
        localStorage.getItem(QUIZ_HIGH_SCORE_KEY);

    const parsed = Number(raw);

    // Validasi eksplisit: pastikan hasil parse berupa angka valid
    // dan tidak negatif, jika tidak fallback ke 0.
    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : 0;

}


function saveHighScore(score) {

    try {

        localStorage.setItem(
            QUIZ_HIGH_SCORE_KEY,
            String(score)
        );

    } catch (error) {

        // localStorage gagal (mis. penuh / mode privat) —
        // biarkan UI tetap berjalan meski high score tidak tersimpan.

    }

}


function updateHighScoreDisplay() {

    const highScore =
        getHighScore();

    highScoreStart.textContent =
        highScore;

    highScoreResult.textContent =
        highScore;

}


/* ---------- Mulai Quiz ---------- */

function startQuizGame() {

    appState.quiz.activeQuestions =
        getShuffledQuestions();

    appState.quiz.currentQuestion = 0;

    appState.quiz.score = 0;

    appState.quiz.answered = false;


    quizStart.classList.add("hidden");

    quizResult.classList.add("hidden");

    quizQuestion.classList.remove(
        "hidden"
    );


    renderQuestion();

}


startQuiz.addEventListener(
    "click",
    startQuizGame
);

restartQuiz.addEventListener(
    "click",
    startQuizGame
);


/* ---------- Render Question ---------- */

function renderQuestion() {

    const question =
        appState.quiz.activeQuestions[appState.quiz.currentQuestion];


    appState.quiz.answered = false;


    quizNumber.textContent =
        `Soal ${appState.quiz.currentQuestion + 1} / ${appState.quiz.activeQuestions.length}`;


    quizScoreElement.textContent =
        `Skor: ${appState.quiz.score}`;


    questionText.textContent =
        question.question;


    answerOptions.innerHTML = "";

    quizFeedback.textContent = "";

    nextQuestion.classList.add(
        "hidden"
    );


    question.options.forEach(
        (option, index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";

            button.className =
                "w-full text-left border rounded-lg px-4 py-3 hover:bg-slate-50";


            button.textContent =
                option;


            button.addEventListener(
                "click",
                () => selectAnswer(index)
            );


            answerOptions.appendChild(
                button
            );

        }
    );

}


/* ---------- Jawab Question ---------- */

function selectAnswer(selectedIndex) {

    if (appState.quiz.answered) {
        return;
    }


    appState.quiz.answered = true;


    const question =
        appState.quiz.activeQuestions[appState.quiz.currentQuestion];


    const buttons =
        answerOptions.querySelectorAll(
            "button"
        );


    buttons.forEach(
        (button) => {

            button.disabled = true;

        }
    );


    if (
        selectedIndex ===
        question.answer
    ) {

        appState.quiz.score++;

        quizFeedback.textContent =
            "Benar! Jawaban kamu tepat.";

        quizFeedback.className =
            "mt-5 font-semibold text-emerald-600";

    } else {

        quizFeedback.textContent =
            `Salah. Jawaban yang benar adalah: ${question.options[question.answer]}`;

        quizFeedback.className =
            "mt-5 font-semibold text-rose-600";

    }


    quizScoreElement.textContent =
        `Skor: ${appState.quiz.score}`;


    nextQuestion.classList.remove(
        "hidden"
    );

}


/* ---------- Next Question ---------- */

nextQuestion.addEventListener(
    "click",
    () => {

        appState.quiz.currentQuestion++;


        if (
            appState.quiz.currentQuestion >=
            appState.quiz.activeQuestions.length
        ) {

            finishQuiz();

            return;

        }


        renderQuestion();

    }
);


/* ---------- Finish Quiz ---------- */

function finishQuiz() {

    quizQuestion.classList.add(
        "hidden"
    );

    quizResult.classList.remove(
        "hidden"
    );


    finalScore.textContent =
        `${appState.quiz.score} / ${appState.quiz.activeQuestions.length}`;


    const oldHighScore =
        getHighScore();


    if (appState.quiz.score > oldHighScore) {

        saveHighScore(appState.quiz.score);

    }


    updateHighScoreDisplay();

}


/* =========================================================
   INISIALISASI
========================================================= */

function initialize() {

    renderExpenses();

    updateExpenseSummary();

    renderBookmarks();

    updateHighScoreDisplay();

}


initialize();