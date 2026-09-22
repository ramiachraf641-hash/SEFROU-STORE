// =====================================================
//                 REGISTER SYSTEM
//                 SUPABASE SIGN UP
// =====================================================

document.addEventListener("DOMContentLoaded", () => {


    // =================================================
    //              REGISTER ELEMENTS
    // =================================================

    const registerForm =
        document.getElementById("registerForm");

    const registerName =
        document.getElementById("registerName");

    const registerEmail =
        document.getElementById("registerEmail");

    const registerPassword =
        document.getElementById("registerPassword");

    const registerConfirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        );

    const registerMessage =
        document.getElementById(
            "registerMessage"
        );

    const toggleRegisterPassword =
        document.getElementById(
            "toggleRegisterPassword"
        );

    const toggleConfirmPassword =
        document.getElementById(
            "toggleConfirmPassword"
        );


    // =================================================
    //          SHOW / HIDE PASSWORD
    // =================================================

    if (
        toggleRegisterPassword &&
        registerPassword
    ) {

        toggleRegisterPassword.addEventListener(
            "click",
            () => {

                const isPassword =
                    registerPassword.type ===
                    "password";

                registerPassword.type =
                    isPassword
                        ? "text"
                        : "password";


                const icon =
                    toggleRegisterPassword
                        .querySelector("i");


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


    // =================================================
    //       SHOW / HIDE CONFIRM PASSWORD
    // =================================================

    if (
        toggleConfirmPassword &&
        registerConfirmPassword
    ) {

        toggleConfirmPassword.addEventListener(
            "click",
            () => {

                const isPassword =
                    registerConfirmPassword.type ===
                    "password";


                registerConfirmPassword.type =
                    isPassword
                        ? "text"
                        : "password";


                const icon =
                    toggleConfirmPassword
                        .querySelector("i");


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


    // =================================================
    //                  REGISTER
    // =================================================

    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                // =========================================
                //                VALUES
                // =========================================

                const name =
                    registerName.value.trim();

                const email =
                    registerEmail.value.trim();

                const password =
                    registerPassword.value;

                const confirmPassword =
                    registerConfirmPassword.value;


                // =========================================
                //              VALIDATION
                // =========================================

                if (
                    !name ||
                    !email ||
                    !password ||
                    !confirmPassword
                ) {

                    registerMessage.textContent =
                        "عافاك عمر جميع المعلومات.";

                    registerMessage.className =
                        "register-message show error";

                    return;

                }


                if (password.length < 6) {

                    registerMessage.textContent =
                        "كلمة المرور خاصها تكون على الأقل 6 أحرف.";

                    registerMessage.className =
                        "register-message show error";

                    return;

                }


                if (
                    password !==
                    confirmPassword
                ) {

                    registerMessage.textContent =
                        "كلمتا المرور غير متطابقتين.";

                    registerMessage.className =
                        "register-message show error";

                    return;

                }


                // =========================================
                //                 LOADING
                // =========================================

                registerMessage.textContent =
                    "جاري إنشاء الحساب...";

                registerMessage.className =
                    "register-message show";


                const submitButton =
                    registerForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                }


                // =========================================
                //              SUPABASE SIGN UP
                // =========================================

                try {

                    const {
                        data,
                        error
                    } =
                        await window.supabaseClient.auth
                            .signUp({

                                email: email,

                                password: password,

                                options: {

                                    data: {

                                        full_name:
                                            name

                                    }

                                }

                            });


                    // =====================================
                    //                  ERROR
                    // =====================================

                    if (error) {

                        console.error(
                            "Supabase Sign Up Error:",
                            error
                        );


                        registerMessage.textContent =
                            error.message ||
                            "تعذر إنشاء الحساب.";

                        registerMessage.className =
                            "register-message show error";


                        if (submitButton) {

                            submitButton.disabled =
                                false;

                        }

                        return;

                    }


                    // =====================================
                    //                SUCCESS
                    // =====================================

                    if (
                        data &&
                        data.user
                    ) {


                        // ---------------------------------
                        // إذا تم إنشاء Session مباشرة
                        // ---------------------------------

                        if (data.session) {

                            registerMessage.textContent =
                                "تم إنشاء الحساب وتسجيل الدخول بنجاح! ✅";

                            registerMessage.className =
                                "register-message show success";


                            setTimeout(() => {

                                window.location.href =
                                    "index.html";

                            }, 800);


                            return;

                        }


                        // ---------------------------------
                        // إذا لم يتم إنشاء Session
                        // ---------------------------------

                        registerMessage.textContent =
                            "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول. ✅";

                        registerMessage.className =
                            "register-message show success";


                        registerForm.reset();


                        if (submitButton) {

                            submitButton.disabled =
                                false;

                        }

                    }

                } catch (error) {

                    console.error(
                        "Unexpected Register Error:",
                        error
                    );


                    registerMessage.textContent =
                        "وقع مشكل أثناء إنشاء الحساب. عاود المحاولة.";

                    registerMessage.className =
                        "register-message show error";


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                    }

                }

            }
        );

    }

});