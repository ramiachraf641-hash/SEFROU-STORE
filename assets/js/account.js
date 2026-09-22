// =====================================================
//                  ACCOUNT SYSTEM
//              USER PROFILE + AUTH
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    //                    ELEMENTS
    // =====================================================

    const accountName =
        document.getElementById("accountName");

    const accountEmail =
        document.getElementById("accountEmail");

    const accountPhone =
        document.getElementById("accountPhone");

    const accountCreatedAt =
        document.getElementById("accountCreatedAt");

    const accountEmailStatus =
        document.getElementById("accountEmailStatus");


    // =====================================================
    //                    NAME
    // =====================================================

    const editNameBtn =
        document.getElementById("editNameBtn");

    const nameEditBox =
        document.getElementById("nameEditBox");

    const nameInput =
        document.getElementById("nameInput");

    const saveNameBtn =
        document.getElementById("saveNameBtn");

    const cancelNameBtn =
        document.getElementById("cancelNameBtn");

    const nameMessage =
        document.getElementById("nameMessage");


    // =====================================================
    //                    PHONE
    // =====================================================

    const editPhoneBtn =
        document.getElementById("editPhoneBtn");

    const phoneEditBox =
        document.getElementById("phoneEditBox");

    const phoneInput =
        document.getElementById("phoneInput");

    const savePhoneBtn =
        document.getElementById("savePhoneBtn");

    const cancelPhoneBtn =
        document.getElementById("cancelPhoneBtn");

    const phoneMessage =
        document.getElementById("phoneMessage");


    // =====================================================
    //                  PASSWORD
    // =====================================================

    const changePasswordBtn =
        document.getElementById("changePasswordBtn");

    const passwordEditBox =
        document.getElementById("passwordEditBox");

    const newPassword =
        document.getElementById("newPassword");

    const confirmNewPassword =
        document.getElementById("confirmNewPassword");

    const toggleNewPassword =
        document.getElementById("toggleNewPassword");

    const toggleConfirmNewPassword =
        document.getElementById("toggleConfirmNewPassword");

    const savePasswordBtn =
        document.getElementById("savePasswordBtn");

    const cancelPasswordBtn =
        document.getElementById("cancelPasswordBtn");

    const passwordMessage =
        document.getElementById("passwordMessage");


    // =====================================================
    //                   LOGOUT
    // =====================================================

    const logoutBtn =
        document.getElementById("logoutBtn");


    // =====================================================
    //              SUPABASE CLIENT
    // =====================================================

    const supabaseClient =
        window.supabaseClient;


    if (!supabaseClient) {

        console.error(
            "ACCOUNT ERROR: Supabase client is not available."
        );

        return;
    }


    // =====================================================
    //                 CURRENT USER
    // =====================================================

    let user = null;

    let currentName = "";
    let currentPhone = "";


    // =====================================================
    //                  GET SESSION
    // =====================================================

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "ACCOUNT SESSION ERROR:",
                error
            );

            return;
        }


        if (!data || !data.session || !data.session.user) {

            console.warn(
                "ACCOUNT: No active session."
            );

            return;
        }


        user =
            data.session.user;


    } catch (error) {

        console.error(
            "ACCOUNT SESSION FATAL ERROR:",
            error
        );

        return;
    }


    // =====================================================
    //                  LOAD PROFILE
    // =====================================================

    async function loadProfile() {

        console.log(
            "PROFILE: Loading from Supabase..."
        );


        try {

            const {
                data,
                error
            } = await supabaseClient

                .from("profiles")

                .select(
                    "id, full_name, phone, created_at"
                )

                .eq(
                    "id",
                    user.id
                )

                .maybeSingle();


            if (error) {

                console.error(
                    "PROFILE LOAD ERROR:",
                    error
                );

                return false;
            }


            // =================================================
            //             PROFILE DOES NOT EXIST
            // =================================================

            if (!data) {

                console.log(
                    "PROFILE: No profile found. Creating one..."
                );


                const {
                    data: newProfile,
                    error: createError
                } = await supabaseClient

                    .from("profiles")

                    .insert({
                        id:
                            user.id,

                        full_name:
                            user.user_metadata?.full_name || "",

                        phone:
                            user.user_metadata?.phone || ""
                    })

                    .select(
                        "id, full_name, phone, created_at"
                    )

                    .single();


                if (createError) {

                    console.error(
                        "PROFILE CREATE ERROR:",
                        createError
                    );

                    return false;
                }


                currentName =
                    newProfile?.full_name || "";

                currentPhone =
                    newProfile?.phone || "";


                console.log(
                    "PROFILE: Created successfully.",
                    newProfile
                );

                return true;
            }


            // =================================================
            //                PROFILE EXISTS
            // =================================================

            currentName =
                data.full_name || "";

            currentPhone =
                data.phone || "";


            console.log(
                "PROFILE: Loaded successfully:",
                data
            );


            return true;


        } catch (error) {

            console.error(
                "PROFILE FATAL ERROR:",
                error
            );

            return false;
        }
    }


    // =====================================================
    //                  DISPLAY PROFILE
    // =====================================================

    function displayProfile() {

        if (accountName) {

            accountName.textContent =
                currentName || "بدون اسم";
        }


        if (accountEmail) {

            accountEmail.textContent =
                user.email || "-";
        }


        if (accountPhone) {

            accountPhone.textContent =
                currentPhone || "غير مضاف";
        }


        if (editPhoneBtn) {

            editPhoneBtn.innerHTML =
                currentPhone

                    ? '<i class="fa-solid fa-pen"></i> تعديل الرقم'

                    : '<i class="fa-solid fa-plus"></i> إضافة رقم';
        }


        if (accountCreatedAt) {

            if (user.created_at) {

                const createdDate =
                    new Date(user.created_at);


                accountCreatedAt.textContent =
                    createdDate.toLocaleDateString(
                        "ar-MA",
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        }
                    );

            } else {

                accountCreatedAt.textContent =
                    "-";
            }
        }


        if (accountEmailStatus) {

            accountEmailStatus.textContent =
                user.email_confirmed_at

                    ? "مؤكد ✓"

                    : "غير مؤكد";
        }
    }


    // =====================================================
    //                PASSWORD TOGGLE
    // =====================================================

    function setupPasswordToggle(
        button,
        input
    ) {

        if (!button || !input) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                const isPassword =
                    input.type === "password";


                input.type =
                    isPassword
                        ? "text"
                        : "password";


                const icon =
                    button.querySelector("i");


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


    setupPasswordToggle(
        toggleNewPassword,
        newPassword
    );


    setupPasswordToggle(
        toggleConfirmNewPassword,
        confirmNewPassword
    );


    // =====================================================
    //             OPEN PASSWORD EDITOR
    // =====================================================

    if (changePasswordBtn) {

        changePasswordBtn.addEventListener(
            "click",
            () => {

                if (passwordEditBox) {

                    passwordEditBox.hidden =
                        false;
                }


                if (newPassword) {

                    newPassword.value =
                        "";

                    newPassword.focus();
                }


                if (confirmNewPassword) {

                    confirmNewPassword.value =
                        "";
                }


                if (passwordMessage) {

                    passwordMessage.textContent =
                        "";

                    passwordMessage.className =
                        "password-message";
                }
            }
        );
    }


    // =====================================================
    //             CANCEL PASSWORD
    // =====================================================

    if (cancelPasswordBtn) {

        cancelPasswordBtn.addEventListener(
            "click",
            () => {

                if (passwordEditBox) {

                    passwordEditBox.hidden =
                        true;
                }


                if (newPassword) {

                    newPassword.value =
                        "";
                }


                if (confirmNewPassword) {

                    confirmNewPassword.value =
                        "";
                }


                if (passwordMessage) {

                    passwordMessage.textContent =
                        "";

                    passwordMessage.className =
                        "password-message";
                }
            }
        );
    }


    // =====================================================
    //              SAVE PASSWORD
    // =====================================================

    if (savePasswordBtn) {

        savePasswordBtn.addEventListener(
            "click",
            async () => {

                const password =
                    newPassword
                        ? newPassword.value
                        : "";


                const confirmPassword =
                    confirmNewPassword
                        ? confirmNewPassword.value
                        : "";


                if (
                    !password ||
                    !confirmPassword
                ) {

                    if (passwordMessage) {

                        passwordMessage.textContent =
                            "عافاك عمر جوج الخانات.";

                        passwordMessage.className =
                            "password-message error";
                    }

                    return;
                }


                if (password.length < 6) {

                    if (passwordMessage) {

                        passwordMessage.textContent =
                            "كلمة المرور خاصها تكون على الأقل 6 أحرف.";

                        passwordMessage.className =
                            "password-message error";
                    }

                    return;
                }


                if (
                    password !==
                    confirmPassword
                ) {

                    if (passwordMessage) {

                        passwordMessage.textContent =
                            "كلمتا المرور غير متطابقتين.";

                        passwordMessage.className =
                            "password-message error";
                    }

                    return;
                }


                savePasswordBtn.disabled =
                    true;


                if (cancelPasswordBtn) {

                    cancelPasswordBtn.disabled =
                        true;
                }


                savePasswordBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';


                try {

                    const {
                        data,
                        error
                    } = await supabaseClient.auth.updateUser({

                        password:
                            password
                    });


                    if (error) {

                        console.error(
                            "PASSWORD UPDATE ERROR:",
                            error
                        );


                        if (passwordMessage) {

                            passwordMessage.textContent =
                                "تعذر تغيير كلمة المرور. حاول مرة أخرى.";

                            passwordMessage.className =
                                "password-message error";
                        }

                        return;
                    }


                    if (data?.user) {

                        user =
                            data.user;
                    }


                    if (passwordMessage) {

                        passwordMessage.textContent =
                            "تم تغيير كلمة المرور بنجاح. ✅";

                        passwordMessage.className =
                            "password-message success";
                    }


                    if (newPassword) {

                        newPassword.value =
                            "";
                    }


                    if (confirmNewPassword) {

                        confirmNewPassword.value =
                            "";
                    }


                    setTimeout(
                        () => {

                            if (passwordEditBox) {

                                passwordEditBox.hidden =
                                    true;
                            }


                            if (passwordMessage) {

                                passwordMessage.textContent =
                                    "";

                                passwordMessage.className =
                                    "password-message";
                            }

                        },
                        1500
                    );


                } catch (error) {

                    console.error(
                        "PASSWORD FATAL ERROR:",
                        error
                    );


                    if (passwordMessage) {

                        passwordMessage.textContent =
                            "وقع مشكل غير متوقع. عاود المحاولة.";

                        passwordMessage.className =
                            "password-message error";
                    }


                } finally {

                    savePasswordBtn.disabled =
                        false;


                    if (cancelPasswordBtn) {

                        cancelPasswordBtn.disabled =
                            false;
                    }


                    savePasswordBtn.innerHTML =
                        '<i class="fa-solid fa-check"></i> حفظ كلمة المرور';
                }
            }
        );
    }


    // =====================================================
    //                 OPEN NAME EDITOR
    // =====================================================

    if (editNameBtn) {

        editNameBtn.addEventListener(
            "click",
            () => {

                if (nameEditBox) {

                    nameEditBox.hidden =
                        false;
                }


                if (nameInput) {

                    nameInput.value =
                        currentName;

                    nameInput.focus();

                    nameInput.select();
                }


                if (nameMessage) {

                    nameMessage.textContent =
                        "";

                    nameMessage.className =
                        "name-message";
                }
            }
        );
    }


    // =====================================================
    //                 CANCEL NAME
    // =====================================================

    if (cancelNameBtn) {

        cancelNameBtn.addEventListener(
            "click",
            () => {

                if (nameEditBox) {

                    nameEditBox.hidden =
                        true;
                }


                if (nameInput) {

                    nameInput.value =
                        currentName;
                }


                if (nameMessage) {

                    nameMessage.textContent =
                        "";

                    nameMessage.className =
                        "name-message";
                }
            }
        );
    }


    // =====================================================
    //                  SAVE NAME
    // =====================================================

    if (saveNameBtn) {

        saveNameBtn.addEventListener(
            "click",
            async () => {

                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : "";


                if (!name) {

                    if (nameMessage) {

                        nameMessage.textContent =
                            "عافاك دخل الاسم الكامل.";

                        nameMessage.className =
                            "name-message error";
                    }

                    return;
                }


                if (name.length < 2) {

                    if (nameMessage) {

                        nameMessage.textContent =
                            "الاسم خاصو يكون على الأقل حرفين.";

                        nameMessage.className =
                            "name-message error";
                    }

                    return;
                }


                saveNameBtn.disabled =
                    true;


                if (cancelNameBtn) {

                    cancelNameBtn.disabled =
                        true;
                }


                saveNameBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';


                try {

                    const {
                        error
                    } = await supabaseClient

                        .from("profiles")

                        .upsert(
                            {
                                id:
                                    user.id,

                                full_name:
                                    name
                            },
                            {
                                onConflict:
                                    "id"
                            }
                        );


                    if (error) {

                        console.error(
                            "NAME UPDATE ERROR:",
                            error
                        );


                        if (nameMessage) {

                            nameMessage.textContent =
                                "تعذر حفظ الاسم. حاول مرة أخرى.";

                            nameMessage.className =
                                "name-message error";
                        }

                        return;
                    }


                    currentName =
                        name;


                    if (accountName) {

                        accountName.textContent =
                            currentName;
                    }


                    if (nameMessage) {

                        nameMessage.textContent =
                            "تم تعديل الاسم بنجاح. ✅";

                        nameMessage.className =
                            "name-message success";
                    }


                    setTimeout(
                        () => {

                            if (nameEditBox) {

                                nameEditBox.hidden =
                                    true;
                            }


                            if (nameMessage) {

                                nameMessage.textContent =
                                    "";

                                nameMessage.className =
                                    "name-message";
                            }

                        },
                        1200
                    );


                } catch (error) {

                    console.error(
                        "NAME FATAL ERROR:",
                        error
                    );


                    if (nameMessage) {

                        nameMessage.textContent =
                            "وقع مشكل غير متوقع.";

                        nameMessage.className =
                            "name-message error";
                    }


                } finally {

                    saveNameBtn.disabled =
                        false;


                    if (cancelNameBtn) {

                        cancelNameBtn.disabled =
                            false;
                    }


                    saveNameBtn.innerHTML =
                        '<i class="fa-solid fa-check"></i> حفظ الاسم';
                }
            }
        );
    }


    // =====================================================
    //                 OPEN PHONE EDITOR
    // =====================================================

    if (editPhoneBtn) {

        editPhoneBtn.addEventListener(
            "click",
            () => {

                if (phoneEditBox) {

                    phoneEditBox.hidden =
                        false;
                }


                if (phoneInput) {

                    phoneInput.value =
                        currentPhone;

                    phoneInput.focus();
                }


                if (phoneMessage) {

                    phoneMessage.textContent =
                        "";

                    phoneMessage.className =
                        "phone-message";
                }
            }
        );
    }


    // =====================================================
    //                 CANCEL PHONE
    // =====================================================

    if (cancelPhoneBtn) {

        cancelPhoneBtn.addEventListener(
            "click",
            () => {

                if (phoneEditBox) {

                    phoneEditBox.hidden =
                        true;
                }


                if (phoneInput) {

                    phoneInput.value =
                        currentPhone;
                }


                if (phoneMessage) {

                    phoneMessage.textContent =
                        "";

                    phoneMessage.className =
                        "phone-message";
                }
            }
        );
    }


    // =====================================================
    //                  SAVE PHONE
    // =====================================================

    if (savePhoneBtn) {

        savePhoneBtn.addEventListener(
            "click",
            async () => {

                const phone =
                    phoneInput
                        ? phoneInput.value.trim()
                        : "";


                if (!phone) {

                    if (phoneMessage) {

                        phoneMessage.textContent =
                            "عافاك دخل رقم الهاتف.";

                        phoneMessage.className =
                            "phone-message error";
                    }

                    return;
                }


                const phonePattern =
                    /^\+?[0-9\s()-]{8,20}$/;


                if (!phonePattern.test(phone)) {

                    if (phoneMessage) {

                        phoneMessage.textContent =
                            "دخل رقم هاتف صحيح.";

                        phoneMessage.className =
                            "phone-message error";
                    }

                    return;
                }


                savePhoneBtn.disabled =
                    true;


                if (cancelPhoneBtn) {

                    cancelPhoneBtn.disabled =
                        true;
                }


                savePhoneBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';


                try {

                    const {
                        error
                    } = await supabaseClient

                        .from("profiles")

                        .upsert(
                            {
                                id:
                                    user.id,

                                phone:
                                    phone
                            },
                            {
                                onConflict:
                                    "id"
                            }
                        );


                    if (error) {

                        console.error(
                            "PHONE UPDATE ERROR:",
                            error
                        );


                        if (phoneMessage) {

                            phoneMessage.textContent =
                                "تعذر حفظ رقم الهاتف. حاول مرة أخرى.";

                            phoneMessage.className =
                                "phone-message error";
                        }

                        return;
                    }


                    currentPhone =
                        phone;


                    if (accountPhone) {

                        accountPhone.textContent =
                            currentPhone;
                    }


                    if (editPhoneBtn) {

                        editPhoneBtn.innerHTML =
                            '<i class="fa-solid fa-pen"></i> تعديل الرقم';
                    }


                    if (phoneMessage) {

                        phoneMessage.textContent =
                            "تم حفظ رقم الهاتف بنجاح. ✅";

                        phoneMessage.className =
                            "phone-message success";
                    }


                    setTimeout(
                        () => {

                            if (phoneEditBox) {

                                phoneEditBox.hidden =
                                    true;
                            }


                            if (phoneMessage) {

                                phoneMessage.textContent =
                                    "";

                                phoneMessage.className =
                                    "phone-message";
                            }

                        },
                        1200
                    );


                } catch (error) {

                    console.error(
                        "PHONE FATAL ERROR:",
                        error
                    );


                    if (phoneMessage) {

                        phoneMessage.textContent =
                            "وقع مشكل غير متوقع.";

                        phoneMessage.className =
                            "phone-message error";
                    }


                } finally {

                    savePhoneBtn.disabled =
                        false;


                    if (cancelPhoneBtn) {

                        cancelPhoneBtn.disabled =
                            false;
                    }


                    savePhoneBtn.innerHTML =
                        '<i class="fa-solid fa-check"></i> حفظ الرقم';
                }
            }
        );
    }


    // =====================================================
    //                    LOGOUT
    // =====================================================

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                if (logoutBtn.disabled) {
                    return;
                }


                logoutBtn.disabled =
                    true;


                logoutBtn.innerHTML =
                    '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل الخروج...';


                try {

                    const {
                        error
                    } = await supabaseClient.auth.signOut();


                    if (error) {

                        console.error(
                            "LOGOUT ERROR:",
                            error
                        );


                        logoutBtn.disabled =
                            false;

                        logoutBtn.innerHTML =
                            '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';

                        return;
                    }


                    // تنظيف أي بيانات محلية مرتبطة بالجلسة
                    // بدون لمس Cart / Wishlist

                    try {

                        sessionStorage.clear();

                    } catch (_) {}


                    window.location.replace(
                        "index.html"
                    );


                } catch (error) {

                    console.error(
                        "LOGOUT FATAL ERROR:",
                        error
                    );


                    logoutBtn.disabled =
                        false;

                    logoutBtn.innerHTML =
                        '<i class="fa-solid fa-right-from-bracket"></i> تسجيل الخروج';
                }
            }
        );
    }


    // =====================================================
    //                  INITIALIZE ACCOUNT
    // =====================================================

    const profileLoaded =
        await loadProfile();


    if (profileLoaded) {

        displayProfile();

    } else {

        // حتى إلا وقع مشكل مؤقت فالـProfile،
        // البريد وبعض معلومات Auth يبقاو ظاهرين.

        if (accountEmail) {

            accountEmail.textContent =
                user.email || "-";
        }


        if (accountEmailStatus) {

            accountEmailStatus.textContent =
                user.email_confirmed_at

                    ? "مؤكد ✓"

                    : "غير مؤكد";
        }


        if (accountCreatedAt) {

            accountCreatedAt.textContent =
                user.created_at
                    ? new Date(
                        user.created_at
                    ).toLocaleDateString(
                        "ar-MA",
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                        }
                    )
                    : "-";
        }
    }


    console.log(
        "ACCOUNT: Profile system ready.",
        {
            userId:
                user.id,

            email:
                user.email,

            name:
                currentName,

            phone:
                currentPhone
        }
    );

});