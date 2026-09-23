let categoryRows = [], editingCategory = null;
const $ = id => document.getElementById(id);
document.addEventListener("DOMContentLoaded", initAdminCategories);
async function initAdminCategories(){
    const {data:userData,error:userError}=await supabaseClient.auth.getUser();
    if(userError||!userData?.user){ location.href=`login.html?redirect=${encodeURIComponent("admin-categories.html")}`; return; }
    const {data:profile}=await supabaseClient.from("profiles").select("role").eq("id",userData.user.id).maybeSingle();
    if(profile?.role!=="admin"){ $('adminCategoryList').textContent="ليس لديك صلاحية إدارة التصنيفات."; return; }
    $('adminCategoryForm').addEventListener('submit',saveCategory); $('adminCategoryNew').addEventListener('click',resetCategoryForm); $('adminCategoryImage').addEventListener('change',previewCategoryImage); await loadCategories();
}
async function loadCategories(){ const {data,error}=await supabaseClient.from('categories').select('*').order('sort_order',{ascending:true}).order('id',{ascending:true}); if(error){$('adminCategoryList').textContent=error.message;return;} categoryRows=data||[]; renderCategories(); }
function renderCategories(){ $('adminCategoryList').innerHTML=categoryRows.length?categoryRows.map(c=>`<article class="admin-category-card"><img src="${esc(categoryImage(c))}" alt=""><div><h3>${esc(c.name||c.title||c.slug||'بدون اسم')}</h3><p>${esc(c.description||'بدون وصف')}</p><div class="admin-category-meta"><span>الترتيب: ${Number(c.sort_order||0)}</span><span class="${c.is_active===false?'off':''}">${c.is_active===false?'غير نشط':'نشط'}</span></div></div><div class="admin-category-actions"><button class="admin-category-edit" data-action="edit" data-id="${c.id}">تعديل</button><button class="admin-category-toggle" data-action="toggle" data-id="${c.id}">${c.is_active===false?'تفعيل':'تعطيل'}</button><button class="admin-category-delete" data-action="delete" data-id="${c.id}">حذف</button></div></article>`).join(''):'لا توجد تصنيفات.'; $('adminCategoryList').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>categoryAction(b.dataset.action,b.dataset.id))); }
async function categoryAction(action,id){const c=categoryRows.find(x=>String(x.id)===String(id)); if(!c)return; if(action==='edit'){editingCategory=c;$('adminCategoryId').value=c.id;$('adminCategoryName').value=c.name||'';$('adminCategoryDescription').value=c.description||'';$('adminCategoryOrder').value=c.sort_order||0;$('adminCategoryActive').checked=c.is_active!==false;$('adminCategoryFormTitle').textContent='تعديل التصنيف';previewCategoryImage();return;} if(action==='toggle'){const {error}=await supabaseClient.from('categories').update({is_active:c.is_active===false,updated_at:new Date().toISOString()}).eq('id',c.id); if(error)return showMsg(error.message,'error'); await loadCategories();return;} const {count,error}=await supabaseClient.from('products').select('id',{count:'exact',head:true}).eq('category_id',c.id); if(error)return showMsg(error.message,'error'); if(count>0)return showMsg('لا يمكن حذف هذا التصنيف لأنه مستعمل من طرف منتجات.','error'); if(!confirm('واش متأكد من حذف التصنيف؟'))return; const {error:delError}=await supabaseClient.from('categories').delete().eq('id',c.id); if(delError)return showMsg(delError.message,'error'); resetCategoryForm();await loadCategories(); }
async function saveCategory(e){e.preventDefault();const name=$('adminCategoryName').value.trim();if(!name)return;const file=$('adminCategoryImage').files[0];const data={name,slug:slugify(name),description:$('adminCategoryDescription').value.trim()||null,sort_order:Math.max(0,Number($('adminCategoryOrder').value)||0),is_active:$('adminCategoryActive').checked,updated_at:new Date().toISOString()};try{if(file){validateImage(file);data.image=await uploadCategoryImage(file);}let q=editingCategory?supabaseClient.from('categories').update(data).eq('id',editingCategory.id):supabaseClient.from('categories').insert(data);const {error}=await q;if(error)throw error;showMsg('تم حفظ التصنيف بنجاح.','success');resetCategoryForm();await loadCategories();}catch(err){showMsg(err.message||'تعذر حفظ التصنيف.','error');}}
function validateImage(f){if(!/^image\/(jpeg|png|webp)$/i.test(f.type)||f.size>5*1024*1024)throw new Error('الصورة خاصها JPG أو PNG أو WebP وحجمها أقل من 5MB.');}
async function uploadCategoryImage(file){
    const {data:u,error:userError}=await supabaseClient.auth.getUser();
    const userId=u?.user?.id||'';
    const extension=(file.type||'').split('/')[1]||'bin';
    const path=`category-images/${userId}/${crypto.randomUUID()}.${extension}`;
    console.info('CATEGORY IMAGE UPLOAD', {bucket:'categories', path, userId, type:file.type, size:file.size, name:file.name});
    if(userError||!userId){
        console.error('CATEGORY IMAGE AUTH ERROR', userError||new Error('No authenticated user'));
        throw userError||new Error('تعذر التحقق من حساب الإدارة.');
    }
    const {error}=await supabaseClient.storage.from('categories').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
    if(error){
        console.error('CATEGORY IMAGE SUPABASE UPLOAD ERROR', {message:error.message, name:error.name, statusCode:error.statusCode, status:error.status, error, bucket:'categories', path, userId, type:file.type, size:file.size});
        throw error;
    }
    return path;
}
function categoryImage(c){const v=c.image_url||c.image||c.path||'';if(!v)return '';return /^https?:/i.test(v)?v:supabaseClient.storage.from('categories').getPublicUrl(v).data.publicUrl;}
function previewCategoryImage(){const f=$('adminCategoryImage').files[0],v=f?URL.createObjectURL(f):(editingCategory?categoryImage(editingCategory):'');$('adminCategoryImagePreview').innerHTML=v?`<img src="${esc(v)}" alt="">`:'<i class="fa-solid fa-image"></i>';}
function resetCategoryForm(){editingCategory=null;$('adminCategoryForm').reset();$('adminCategoryId').value='';$('adminCategoryActive').checked=true;$('adminCategoryFormTitle').textContent='إضافة تصنيف';$('adminCategoryImagePreview').innerHTML='<i class="fa-solid fa-image"></i>';}
function showMsg(t,type){$('adminCategoryMessage').textContent=t;$('adminCategoryMessage').className=`admin-category-message show ${type}`;}
function slugify(v){return v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||`category-${Date.now()}`;}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
