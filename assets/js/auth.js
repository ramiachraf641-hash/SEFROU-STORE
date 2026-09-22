// =====================================================
//              SEFROU STORE - AUTH SYSTEM
// =====================================================


// =====================================================
//              SUPABASE CLIENT
// =====================================================

const supabaseClient = window.supabaseClient;


// =====================================================
//              LOGIN ELEMENTS
// =====================================================

const loginForm =
    document.getElementById("loginForm");

const loginEmail =
    document.getElementById("loginEmail");

const loginPassword =
    document.getElementById("loginPassword");

const loginMessage =
    document.getElementById("loginMessage");

const togglePassword =
    document.getElementById("togglePassword");

const googleLoginBtn =
    document.getElementById("googleLoginBtn");


// =====================================================
//              MESSAGE FUNCTION
// =====================================================

function showLoginMessage(
    message,
    type = "error"
) {

    if (!loginMessage) return;

    loginMessage.textContent =
        message;

    loginMessage.className =
        "login-message show " + type;

}


function getPostLoginRedirect() {

    const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");

    if (!requestedRedirect || requestedRedirect.startsWith("//") || requestedRedirect.includes("://")) {
        return "account.html";
    }

    return requestedRedirect.startsWith("/") ? requestedRedirect.slice(1) : requestedRedirect;

}


// =====================================================
//              SHOW / HIDE PASSWORD
// =====================================================

if (
    togglePassword &&
    loginPassword
) {

    togglePassword.addEventListener(
        "click",
        () => {

            const isPassword =
                loginPassword.type ===
                "password";


            loginPassword.type =
                isPassword
                    ? "text"
                    : "password";


            const icon =
                togglePassword.querySelector(
                    "i"
                );


            if (icon) {

                icon.classList.toggle(
                    "fa-eye",
                    !isPassword
                );

                icon.classList.toggle(
                    "fa-eye-slash",
                    isPassword
                );

            }

        }
    );

}


// =====================================================
//              EMAIL LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const email =
                loginEmail
                    ? loginEmail.value.trim()
                    : "";


            const password =
                loginPassword
                    ? loginPassword.value
                    : "";


            if (
                !email ||
                !password
            ) {

                showLoginMessage(
                    "المرجو إدخال البريد الإلكتروني وكلمة المرور."
                );

                return;

            }


            const submitButton =
                loginForm.querySelector(
                    ".login-submit"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    جاري تسجيل الدخول...
                `;

            }


            try {

                const {
                    data,
                    error
                } =
                    await  window.supabaseClient
                        .auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (error) {

                    throw error;

                }


                console.log(
                    "Email login successful:",
                    data.user
                );


                showLoginMessage(
                    "تم تسجيل الدخول بنجاح ✅",
                    "success"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            getPostLoginRedirect();

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "Email login error:",
                    error
                );


                let message =
                    "حدث خطأ أثناء تسجيل الدخول.";


                if (
                    error.message &&
                    error.message
                        .toLowerCase()
                        .includes(
                            "invalid login credentials"
                        )
                ) {

                    message =
                        "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

                }


                if (
                    error.message &&
                    error.message
                        .toLowerCase()
                        .includes(
                            "email not confirmed"
                        )
                ) {

                    message =
                        "المرجو تأكيد البريد الإلكتروني أولاً.";

                }


                showLoginMessage(
                    message
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML = `
                        <i class="fa-solid fa-right-to-bracket"></i>
                        تسجيل الدخول
                    `;

                }

            }

        }
    );

}


// =====================================================
//              GOOGLE LOGIN
// =====================================================

console.log(
    "GOOGLE BUTTON:",
    googleLoginBtn
);

console.log(
    "GOOGLE AUTH CODE LOADED"
);


if (googleLoginBtn) {

    googleLoginBtn.addEventListener(
        "click",
        async () => {

            console.log(
                "GOOGLE BUTTON CLICKED"
            );


            try {

                googleLoginBtn.disabled =
                    true;


                googleLoginBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    جاري الاتصال بـ Google...
                `;


                const redirectUrl =
                    window.location.origin +
                    window.location.pathname +
                    window.location.search;


                console.log(
                    "Google Redirect URL:",
                    redirectUrl
                );


                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signInWithOAuth({

                            provider:
                                "google",

                            options: {

                                redirectTo:
                                    redirectUrl

                            }

                        });


                if (error) {

                    throw error;

                }


                console.log(
                    "Google OAuth started:",
                    data
                );


            } catch (error) {

                console.error(
                    "Google login error:",
                    error
                );


                showLoginMessage(
                    "تعذر تسجيل الدخول بواسطة Google. حاول مرة أخرى."
                );


                googleLoginBtn.disabled =
                    false;


                googleLoginBtn.innerHTML = `
                    <i class="fa-brands fa-google"></i>
                    تسجيل الدخول بواسطة Google
                `;

            }

        }
    );

}


// =====================================================
//              UPDATE LOGIN BUTTON
// =====================================================

function updateLoginButtons(session) {

    const loginButtons =
        document.querySelectorAll(
            ".login-btn"
        );


    loginButtons.forEach(
        (button) => {

            if (
                session &&
                session.user
            ) {

                // المستخدم داخل
                button.textContent =
                    "حسابي";

                button.href =
                    "account.html";

                button.classList.add(
                    "logged-in"
                );


            } else {

                // المستخدم خارج
                button.textContent =
                    "تسجيل الدخول";

                button.href =
                    "login.html";

                button.classList.remove(
                    "logged-in"
                );

            }

        }
    );

}


// =====================================================
//              GET CURRENT SESSION
// =====================================================

async function checkSession() {

    try {

        const {
            data,
            error
        } =
            await  window.supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return null;

        }


        const session =
            data.session;


        console.log(
            "Current session:",
            session
        );


        updateLoginButtons(
            session
        );


        return session;


    } catch (error) {

        console.error(
            "Failed to get session:",
            error
        );

        return null;

    }

}


// =====================================================
//              AUTH STATE CHANGE
// =====================================================

 window.supabaseClient.auth.onAuthStateChange(
    (event, session) => {

        console.log(
            "Supabase Auth Event:",
            event
        );


        // تحديث الزر مباشرة حسب Session
        updateLoginButtons(
            session
        );


        // =================================================
        //                  USER SIGNED IN
        // =================================================

        if (
            event === "SIGNED_IN" &&
            session &&
            session.user
        ) {

            console.log(
                "User signed in:",
                session.user.email
            );


            /*
             * إذا كان المستخدم داخل login.html
             * نمشيو للحساب
             */

            if (
                window.location.pathname
                    .toLowerCase()
                    .endsWith(
                        "login.html"
                    )
            ) {

                window.location.href =
                    getPostLoginRedirect();

            }

        }


        // =================================================
        //                 USER SIGNED OUT
        // =================================================

        if (
            event === "SIGNED_OUT"
        ) {

            console.log(
                "User signed out"
            );


            // يرجع زر تسجيل الدخول
            updateLoginButtons(
                null
            );

        }

    }
);


// =====================================================
//              INITIAL SESSION CHECK
// =====================================================

checkSession();
