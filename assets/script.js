/**
 * Praktikum 3 - JavaScript
 *
 * Fitur:
 * 1. Expense Tracker
 * 2. Bookmark Manager
 * 3. Quiz App
 *
 * Semua data disimpan menggunakan localStorage.
 */


/* =========================================================
   UTILITAS
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


/* =========================================================
   TAB NAVIGATION
========================================================= */

const TAB_STORAGE_KEY = "pabwe-p3-active-tab";

const tabButtons = $all(".tab-btn");

const panels = {
    expense: $("#panel-expense"),
    bookmark: $("#panel-bookmark"),
    quiz: $("#panel-quiz")
};


function switchTab(tabName) {

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


    localStorage.setItem(
        TAB_STORAGE_KEY,
        tabName
    );
}


tabButtons.forEach((button) => {

    button.addEventListener("click", () => {

        switchTab(button.dataset.tab);

    });

});


const savedTab =
    localStorage.getItem(TAB_STORAGE_KEY) || "expense";

switchTab(savedTab);



/* =========================================================
   EXPENSE TRACKER
========================================================= */

const EXPENSE_STORAGE_KEY = "pabwe-p3-expenses";

let expenses = loadExpenses();

let editingExpenseId = null;
let deletingExpenseId = null;


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


/* ---------- Load / Save ---------- */

function loadExpenses() {

    try {

        const data =
            localStorage.getItem(EXPENSE_STORAGE_KEY);

        return data ? JSON.parse(data) : [];

    } catch (error) {

        return [];

    }
}


function saveExpenses() {

    localStorage.setItem(
        EXPENSE_STORAGE_KEY,
        JSON.stringify(expenses)
    );

}


/* ---------- Ringkasan ---------- */

function updateExpenseSummary() {

    let income = 0;
    let expense = 0;

    expenses.forEach((item) => {

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


    let items = expenses.filter((item) => {

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


    if (expenses.length === 0) {

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


    if (!title ||
        !category ||
        !date ||
        !Number.isFinite(amount) ||
        amount <= 0) {

        alert(
            "Semua field wajib diisi dan jumlah harus lebih dari 0."
        );

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


    expenses.push(newExpense);

    saveExpenses();

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

        deletingExpenseId =
            Number(deleteButton.dataset.id);

        deleteExpenseModal.classList.remove(
            "hidden"
        );

    }

});


/* ---------- Modal Edit Expense ---------- */

function openExpenseEdit(id) {

    const item =
        expenses.find(
            (expense) => expense.id === id
        );


    if (!item) {
        return;
    }


    editingExpenseId = id;

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


        if (!title ||
            !category ||
            !date ||
            !Number.isFinite(amount) ||
            amount <= 0) {

            alert(
                "Data tidak valid."
            );

            return;

        }


        const item =
            expenses.find(
                (expense) =>
                    expense.id === editingExpenseId
            );


        if (item) {

            item.title = title;
            item.category = category;
            item.amount = amount;
            item.type = type;
            item.date = date;

        }


        saveExpenses();

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

        deletingExpenseId = null;

    });


$("#confirm-expense-delete")
    .addEventListener("click", () => {

        expenses =
            expenses.filter(
                (item) =>
                    item.id !== deletingExpenseId
            );


        saveExpenses();

        renderExpenses();

        updateExpenseSummary();


        deleteExpenseModal.classList.add(
            "hidden"
        );

        deletingExpenseId = null;

    });



/* =========================================================
   BOOKMARK MANAGER
========================================================= */

const BOOKMARK_STORAGE_KEY =
    "pabwe-p3-bookmarks";

let bookmarks = loadBookmarks();

let editingBookmarkId = null;
let deletingBookmarkId = null;


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


/* ---------- Load / Save ---------- */

function loadBookmarks() {

    try {

        const data =
            localStorage.getItem(
                BOOKMARK_STORAGE_KEY
            );

        return data ? JSON.parse(data) : [];

    } catch (error) {

        return [];

    }

}


function saveBookmarks() {

    localStorage.setItem(
        BOOKMARK_STORAGE_KEY,
        JSON.stringify(bookmarks)
    );

}


/* ---------- Validasi URL ---------- */

function isValidURL(url) {

    return /^https?:\/\//i.test(url);

}


/* ---------- Render Bookmark ---------- */

function renderBookmarks() {

    const search =
        bookmarkSearch.value
            .trim()
            .toLowerCase();


    const sort =
        bookmarkSort.value;


    let items =
        bookmarks.filter((item) => {

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


    if (bookmarks.length === 0) {

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


        if (!title ||
            !url ||
            !category) {

            alert(
                "Nama, URL, dan kategori wajib diisi."
            );

            return;

        }


        if (!isValidURL(url)) {

            alert(
                "URL harus diawali http:// atau https://."
            );

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


        bookmarks.push(newBookmark);

        saveBookmarks();

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

            deletingBookmarkId =
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
        bookmarks.find(
            (bookmark) =>
                bookmark.id === id
        );


    if (!item) {
        return;
    }


    editingBookmarkId = id;

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


        if (!title ||
            !url ||
            !category) {

            alert(
                "Nama, URL, dan kategori wajib diisi."
            );

            return;

        }


        if (!isValidURL(url)) {

            alert(
                "URL harus diawali http:// atau https://."
            );

            return;

        }


        const item =
            bookmarks.find(
                (bookmark) =>
                    bookmark.id === editingBookmarkId
            );


        if (item) {

            item.title = title;
            item.url = url;
            item.category = category;
            item.note = note;

        }


        saveBookmarks();

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

        deletingBookmarkId = null;

    });


$("#confirm-bookmark-delete")
    .addEventListener(
        "click",
        () => {

            bookmarks =
                bookmarks.filter(
                    (item) =>
                        item.id !==
                        deletingBookmarkId
                );


            saveBookmarks();

            renderBookmarks();


            deleteBookmarkModal.classList.add(
                "hidden"
            );

            deletingBookmarkId = null;

        }
    );



/* =========================================================
   QUIZ APP
========================================================= */

const QUIZ_HIGH_SCORE_KEY =
    "pabwe-p3-quiz-high-score";


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


let currentQuestion = 0;
let quizScore = 0;
let answered = false;


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

    return Number(
        localStorage.getItem(
            QUIZ_HIGH_SCORE_KEY
        ) || 0
    );

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

    currentQuestion = 0;

    quizScore = 0;

    answered = false;


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
        questions[currentQuestion];


    answered = false;


    quizNumber.textContent =
        `Soal ${currentQuestion + 1} / ${questions.length}`;


    quizScoreElement.textContent =
        `Skor: ${quizScore}`;


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

    if (answered) {
        return;
    }


    answered = true;


    const question =
        questions[currentQuestion];


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

        quizScore++;

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
        `Skor: ${quizScore}`;


    nextQuestion.classList.remove(
        "hidden"
    );

}


/* ---------- Next Question ---------- */

nextQuestion.addEventListener(
    "click",
    () => {

        currentQuestion++;


        if (
            currentQuestion >=
            questions.length
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
        `${quizScore} / ${questions.length}`;


    const oldHighScore =
        getHighScore();


    if (quizScore > oldHighScore) {

        localStorage.setItem(
            QUIZ_HIGH_SCORE_KEY,
            quizScore
        );

    }


    updateHighScoreDisplay();

}


/* =========================================================
   KEAMANAN OUTPUT HTML
========================================================= */

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