
let leads = [];
let filteredLeads = [];
let currentLead = null;


/* ================= DATA ================= */

async function loadCSV() {

    try {

        const response = await fetch("leadiq_seller_view.csv");

        if (!response.ok) {
            throw new Error("CSV could not be loaded");
        }

        const text = await response.text();

        leads = parseCSV(text).map(normalizeLead);

        filteredLeads = [...leads];

        initializeApp();

    } catch (error) {

        console.error(error);

        document.getElementById("lead-list").innerHTML = `
            <div class="metric-card">
                <h3>Unable to load lead data</h3>
                <p style="margin-top:8px;color:#8f9ab0;">
                    Make sure LeadIQ is running at
                    http://localhost:8000
                </p>
            </div>
        `;
    }
}


function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && insideQuotes && next === '"') {
            value += '"';
            i++;
        }

        else if (char === '"') {
            insideQuotes = !insideQuotes;
        }

        else if (char === "," && !insideQuotes) {
            row.push(value);
            value = "";
        }

        else if (
            (char === "\n" || char === "\r")
            && !insideQuotes
        ) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value);

            if (row.some(x => x.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";

        }

        else {
            value += char;
        }
    }


    if (value !== "" || row.length > 0) {

        row.push(value);

        if (row.some(x => x.trim() !== "")) {
            rows.push(row);
        }
    }


    if (!rows.length) {
        return [];
    }


    const headers = rows[0].map(
        header => header.trim()
    );


    return rows.slice(1).map(row => {

        const object = {};

        headers.forEach((header, index) => {

            object[header] =
                (row[index] || "").trim();

        });

        return object;
    });
}


function normalizeLead(row) {

    const numericFields = [

        "rank",
        "buyer_id",
        "seller_id",

        "quantity",
        "inquiry_value",

        "previous_orders",
        "previous_inquiries",

        "repeat_buyer",
        "previous_conversion_rate",

        "buyer_seller_previous_inquiries",
        "buyer_seller_previous_orders",

        "seller_rating",
        "seller_experience",

        "conversion_probability",
        "ai_score",
        "priority_score"

    ];


    numericFields.forEach(field => {

        if (
            row[field] !== undefined &&
            row[field] !== ""
        ) {

            row[field] = Number(row[field]);

        }

    });


    return row;
}


/* ================= INITIALIZE ================= */

function initializeApp() {

    setupNavigation();

    setupFilters();

    setupDrawer();

    renderOverview();

    renderInbox();

}


/* ================= NAVIGATION ================= */

function setupNavigation() {

    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => showPage(button.dataset.page)
            );

        });


    document
        .getElementById("open-inbox")
        .addEventListener(
            "click",
            () => showPage("inbox")
        );

}


function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(section =>
            section.classList.remove("active")
        );


    document
        .querySelectorAll(".nav-item")
        .forEach(button =>
            button.classList.remove("active")
        );


    const targetPage =
        page === "home"
            ? "home-page"
            : "inbox-page";


    document
        .getElementById(targetPage)
        .classList.add("active");


    document
        .querySelector(
            `[data-page="${page}"]`
        )
        .classList.add("active");

}


/* ================= OVERVIEW ================= */

function renderOverview() {

    const highPriority =
        leads.filter(
            lead => lead.priority_tier === "High"
        );


    const highValue =
        highPriority.reduce(
            (sum, lead) =>
                sum + Number(lead.inquiry_value || 0),
            0
        );


    document
        .getElementById("total-leads")
        .textContent =
            leads.length.toLocaleString();


    document
        .getElementById("high-leads")
        .textContent =
            highPriority.length.toLocaleString();


    document
        .getElementById("high-value")
        .textContent =
            formatINR(highValue);


    renderTopLeads();

}


/* ================= TOP LEADS ================= */

function renderTopLeads() {

    const topLeads =
        [...leads]
        .sort(
            (a, b) =>
                Number(a.rank) - Number(b.rank)
        )
        .slice(0, 5);


    document
        .getElementById("top-leads-container")
        .innerHTML = `

            <div class="lead-cards">

                ${
                    topLeads
                    .map(
                        (lead, index) =>
                            createTopLeadCard(
                                lead,
                                index
                            )
                    )
                    .join("")
                }

            </div>
        `;


    document
        .querySelectorAll(".lead-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            card.dataset.index
                        );

                    openLeadDrawer(
                        topLeads[index]
                    );

                }
            );

        });

}


function createTopLeadCard(
    lead,
    index
) {

    return `

        <div
            class="lead-card"
            data-index="${index}"
        >

            <div class="lead-main">

                <strong>
                    Buyer ${lead.buyer_id}
                </strong>

                <div class="lead-meta">

                    ${lead.product_category}
                    ·
                    ${lead.buyer_industry}
                    ·
                    ${lead.buyer_location}

                </div>

            </div>


            <div>

                <span
                    class="priority-badge
                    ${priorityClass(lead.priority_tier)}"
                >

                    ${lead.priority_tier}

                </span>

            </div>


            <div class="lead-score">

                <div class="score-value">

                    ${formatScore(lead.priority_score)}

                </div>

                <div class="score-label">
                    AI SCORE
                </div>

            </div>

        </div>
    `;
}


/* ================= FILTERS ================= */

function setupFilters() {

    const urgencyFilter =
        document.getElementById(
            "urgency-filter"
        );


    const categoryFilter =
        document.getElementById(
            "category-filter"
        );


    uniqueValues("urgency")
        .forEach(value => {

            urgencyFilter.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(value)}">
                    ${escapeHTML(value)}
                </option>
                `
            );

        });


    uniqueValues("product_category")
        .forEach(value => {

            categoryFilter.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(value)}">
                    ${escapeHTML(value)}
                </option>
                `
            );

        });


    document
        .getElementById("priority-filter")
        .addEventListener(
            "change",
            applyFilters
        );


    urgencyFilter
        .addEventListener(
            "change",
            applyFilters
        );


    categoryFilter
        .addEventListener(
            "change",
            applyFilters
        );


    document
        .getElementById("search-input")
        .addEventListener(
            "input",
            applyFilters
        );

}


function uniqueValues(field) {

    return [
        ...new Set(
            leads
                .map(lead => lead[field])
                .filter(
                    value =>
                        value !== undefined &&
                        value !== ""
                )
        )
    ].sort();

}


/* ================= FILTER LOGIC ================= */

function applyFilters() {

    const priority =
        document
        .getElementById("priority-filter")
        .value;


    const urgency =
        document
        .getElementById("urgency-filter")
        .value;


    const category =
        document
        .getElementById("category-filter")
        .value;


    const search =
        document
        .getElementById("search-input")
        .value
        .toLowerCase()
        .trim();


    filteredLeads =
        leads.filter(lead => {

            const priorityMatch =
                priority === "All" ||
                lead.priority_tier === priority;


            const urgencyMatch =
                urgency === "All" ||
                lead.urgency === urgency;


            const categoryMatch =
                category === "All" ||
                lead.product_category === category;


            const searchable = [

                lead.buyer_id,
                lead.seller_id,
                lead.product_category,
                lead.buyer_industry,
                lead.buyer_location,
                lead.buyer_company_size

            ]
            .join(" ")
            .toLowerCase();


            const searchMatch =
                search === "" ||
                searchable.includes(search);


            return (
                priorityMatch &&
                urgencyMatch &&
                categoryMatch &&
                searchMatch
            );

        });


    renderInbox();

}


/* ================= PRIORITY INBOX ================= */

function renderInbox() {

    const container =
        document.getElementById(
            "lead-list"
        );


    document
        .getElementById(
            "filtered-count"
        )
        .textContent =
            filteredLeads.length.toLocaleString();


    if (!filteredLeads.length) {

        container.innerHTML = `

            <div class="metric-card">

                <h3>
                    No leads found
                </h3>

                <p style="margin-top:8px;color:#8f9ab0;">
                    Try changing your filters.
                </p>

            </div>

        `;

        return;
    }


    const sorted =
        [...filteredLeads]
        .sort(
            (a, b) =>
                Number(a.rank) -
                Number(b.rank)
        );


    container.innerHTML = `

        <div class="inbox-list">

            ${sorted
                .map(
                    (lead, index) =>
                        createInboxRow(
                            lead,
                            index
                        )
                )
                .join("")}

        </div>
    `;


    container
        .querySelectorAll(".inbox-row")
        .forEach((row, index) => {

            row.addEventListener(
                "click",
                () =>
                    openLeadDrawer(
                        sorted[index]
                    )
            );

        });

}


/* ================= INBOX ROW ================= */

function createInboxRow(
    lead,
    index
) {

    return `

        <div class="inbox-row">

            <div class="rank-number">
                #${lead.rank}
            </div>


            <div class="inbox-buyer">

                <strong>
                    Buyer ${lead.buyer_id}
                </strong>

                <span>
                    ${lead.buyer_location}
                </span>

            </div>


            <div class="inbox-info">

                <strong>
                    ${lead.product_category}
                </strong>

                <span>
                    ${lead.buyer_industry}
                </span>

            </div>


            <div class="inbox-info">

                <strong>
                    ${lead.quantity} units
                </strong>

                <span>
                    ${formatINR(
                        lead.inquiry_value
                    )}
                </span>

            </div>


            <div>

                <span
                    class="priority-badge
                    ${urgencyClass(lead.urgency)}"
                >

                    ${lead.urgency}

                </span>

            </div>


            <div class="inbox-score">

                ${formatScore(lead.priority_score)}

                <span style="
                    display:block;
                    color:#69748b;
                    font-size:9px;
                    font-weight:500;
                ">
                    AI SCORE
                </span>

            </div>


            <div>

                <span
                    class="priority-badge
                    ${priorityClass(lead.priority_tier)}"
                >

                    ${lead.priority_tier}

                </span>

            </div>


            <div class="arrow">
                →
            </div>

        </div>

    `;

}


/* ================= DRAWER ================= */

function setupDrawer() {

    document
        .getElementById(
            "close-drawer"
        )
        .addEventListener(
            "click",
            closeDrawer
        );


    document
        .getElementById(
            "drawer-overlay"
        )
        .addEventListener(
            "click",
            closeDrawer
        );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeDrawer();
            }

        }
    );

}


function openLeadDrawer(lead) {

    currentLead = lead;


    document
        .getElementById(
            "drawer-title"
        )
        .textContent =
            `Buyer ${lead.buyer_id}`;


    document
        .getElementById(
            "drawer-content"
        )
        .innerHTML =
            createLeadDetail(lead);


    document
        .getElementById(
            "lead-drawer"
        )
        .classList.add("open");


    document
        .getElementById(
            "drawer-overlay"
        )
        .classList.add("open");


    document
        .getElementById(
            "generate-response"
        )
        .addEventListener(
            "click",
            () =>
                generateResponseForLead(
                    lead
                )
        );


    document
        .getElementById(
            "copy-response"
        )
        .addEventListener(
            "click",
            copyGeneratedResponse
        );

}


function closeDrawer() {

    document
        .getElementById(
            "lead-drawer"
        )
        .classList.remove("open");


    document
        .getElementById(
            "drawer-overlay"
        )
        .classList.remove("open");

}


/* ================= DETAIL ================= */

function createLeadDetail(lead) {

    const reasons =
        generateReasons(lead);


    return `

        <div class="detail-score">

            <div class="detail-score-label">
                AI PRIORITY SCORE
            </div>

            <div class="detail-score-value">

                ${formatScore(lead.priority_score)}

            </div>

            <div class="detail-score-sub">

                Conversion probability:
                ${formatProbability(
                    lead.conversion_probability
                )}

            </div>

            <div style="margin-top:10px;">

                <span
                    class="priority-badge
                    ${priorityClass(
                        lead.priority_tier
                    )}"
                >

                    ${lead.priority_tier}
                    PRIORITY

                </span>

            </div>

        </div>


        <div class="detail-section">

            <h3>
                BUYER & REQUIREMENT
            </h3>


            <div class="detail-grid">

                ${detailItem(
                    "Product",
                    lead.product_category
                )}

                ${detailItem(
                    "Industry",
                    lead.buyer_industry
                )}

                ${detailItem(
                    "Location",
                    lead.buyer_location
                )}

                ${detailItem(
                    "Company Size",
                    lead.buyer_company_size
                )}

                ${detailItem(
                    "Quantity",
                    `${lead.quantity} units`
                )}

                ${detailItem(
                    "Inquiry Value",
                    formatINR(
                        lead.inquiry_value
                    )
                )}

                ${detailItem(
                    "Urgency",
                    lead.urgency
                )}

                ${detailItem(
                    "Lead Source",
                    lead.lead_source
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                BUYER HISTORY
            </h3>


            <div class="detail-grid">

                ${detailItem(
                    "Previous Orders",
                    lead.previous_orders
                )}

                ${detailItem(
                    "Previous Inquiries",
                    lead.previous_inquiries
                )}

                ${detailItem(
                    "Repeat Buyer",
                    Number(
                        lead.repeat_buyer
                    ) === 1
                        ? "Yes"
                        : "No"
                )}

                ${detailItem(
                    "Conversion History",
                    formatProbability(
                        lead.previous_conversion_rate
                    )
                )}

                ${detailItem(
                    "Buyer-Seller Inquiries",
                    lead.buyer_seller_previous_inquiries
                )}

                ${detailItem(
                    "Buyer-Seller Orders",
                    lead.buyer_seller_previous_orders
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                SELLER PROFILE
            </h3>


            <div class="detail-grid">

                ${detailItem(
                    "Seller Rating",
                    `${Number(
                        lead.seller_rating
                    ).toFixed(2)} / 5`
                )}

                ${detailItem(
                    "Seller Experience",
                    `${Number(
                        lead.seller_experience
                    ).toFixed(1)} years`
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                WHY PRIORITIZE?
            </h3>


            <div class="reason-list">

                ${
                    reasons.length
                    ?
                    reasons
                        .map(
                            reason => `
                                <div class="reason-item">
                                    ${escapeHTML(
                                        reason
                                    )}
                                </div>
                            `
                        )
                        .join("")
                    :
                    `
                        <div class="reason-item">
                            Strong overall lead profile.
                        </div>
                    `
                }

            </div>

        </div>


        <div class="detail-section">

            <h3>
                RECOMMENDED ACTION
            </h3>


            <div class="action-box">

                ${escapeHTML(
                    lead.recommended_action
                )}

            </div>

        </div>


        <div class="detail-section">

            <h3>
                ✦ AI RESPONSE ASSISTANT
            </h3>


            <button
                id="generate-response"
                class="generate-button"
            >
                ✦ Generate AI Response
            </button>


            <div
                id="response-container"
                style="display:none;"
            >

                <div class="ai-response">

                    <div class="ai-label">
                        SUGGESTED SELLER RESPONSE
                    </div>

                    <div
                        id="generated-response"
                    ></div>

                </div>


                <button
                    id="copy-response"
                    class="copy-button"
                >
                    Copy Response
                </button>

            </div>

        </div>

    `;

}


function detailItem(
    label,
    value
) {

    return `

        <div class="detail-item">

            <label>
                ${escapeHTML(label)}
            </label>

            <strong>
                ${
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                    ?
                    escapeHTML(
                        String(value)
                    )
                    :
                    "—"
                }
            </strong>

        </div>

    `;

}


/* ================= EXPLANATIONS ================= */

function generateReasons(lead) {

    const reasons = [];


    if (lead.urgency === "Critical") {

        reasons.push(
            "Critical urgency — immediate response recommended."
        );

    }

    else if (lead.urgency === "High") {

        reasons.push(
            "High urgency — buyer requirement is time-sensitive."
        );

    }


    if (
        Number(
            lead.repeat_buyer
        ) === 1
    ) {

        reasons.push(
            `Repeat buyer with ${lead.previous_orders} previous orders.`
        );

    }


    if (
        lead.buyer_company_size === "Large" ||
        lead.buyer_company_size === "Enterprise"
    ) {

        reasons.push(
            `${lead.buyer_company_size} buyer profile.`
        );

    }


    if (
        Number(
            lead.inquiry_value
        ) >= 20000
    ) {

        reasons.push(
            `High inquiry value — ${formatINR(
                lead.inquiry_value
            )}.`
        );

    }


    if (
        Number(
            lead.quantity
        ) >= 10
    ) {

        reasons.push(
            `Large requirement — ${lead.quantity} units.`
        );

    }


    if (
        Number(
            lead.seller_rating
        ) >= 4.5
    ) {

        reasons.push(
            `Strong seller rating — ${
                Number(
                    lead.seller_rating
                ).toFixed(2)
            }/5.`
        );

    }


    return reasons.slice(0, 4);

}


/* ================= AI RESPONSE ================= */

function generateResponseForLead(lead) {

    const container =
        document.getElementById(
            "response-container"
        );


    const output =
        document.getElementById(
            "generated-response"
        );


    let opening;


    if (lead.urgency === "Critical") {

        opening =
            "Thank you for your urgent inquiry. We are prioritizing your requirement.";

    }

    else if (lead.urgency === "High") {

        opening =
            "Thank you for your inquiry. We understand that your requirement is time-sensitive.";

    }

    else {

        opening =
            "Thank you for reaching out regarding your requirement.";

    }


    const repeatLine =
        Number(
            lead.repeat_buyer
        ) === 1
        ?
        " We appreciate your continued business with us."
        :
        "";


    const response = `

        ${opening}${repeatLine}

        We can assist with
        ${lead.product_category}
        for ${lead.quantity} units.

        We would be happy to confirm availability,
        pricing and delivery timelines based on your
        requirement.

        Please share any additional specifications or
        delivery requirements, and we will get back
        to you promptly.

    `.trim();


    output.textContent = response;

    container.style.display = "block";

}


async function copyGeneratedResponse() {

    const text =
        document
        .getElementById(
            "generated-response"
        )
        .textContent;


    try {

        await navigator.clipboard.writeText(
            text
        );


        const button =
            document.getElementById(
                "copy-response"
            );


        button.textContent =
            "✓ Copied";


        setTimeout(
            () => {
                button.textContent =
                    "Copy Response";
            },
            1500
        );

    }

    catch (error) {

        console.error(error);

    }

}


/* ================= HELPERS ================= */

function priorityClass(
    priority
) {

    if (priority === "High") {
        return "priority-high";
    }

    if (priority === "Medium") {
        return "priority-medium";
    }

    return "priority-low";

}


function urgencyClass(
    urgency
) {

    if (urgency === "Critical") {
        return "urgency-critical";
    }

    if (urgency === "High") {
        return "urgency-high";
    }

    return "urgency-normal";

}


function formatINR(value) {

    const number =
        Number(value || 0);


    if (number >= 10000000) {

        return (
            "₹" +
            (
                number / 10000000
            ).toFixed(1) +
            " Cr"
        );

    }


    if (number >= 100000) {

        return (
            "₹" +
            (
                number / 100000
            ).toFixed(1) +
            " L"
        );

    }


    return (
        "₹" +
        Math.round(
            number
        ).toLocaleString(
            "en-IN"
        )
    );

}


function formatScore(value) {

    return Number(
        value || 0
    ).toFixed(1);

}


function formatProbability(value) {

    return (
        Number(
            value || 0
        ) * 100
    ).toFixed(1) + "%";

}


function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ================= START ================= */

loadCSV();
