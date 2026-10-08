# Arrow BJJ — feed, profile, training шинэчлэлт

## Хүссэн 16 өөрчлөлт

| № | Өөрчлөлт | Хэрэгжилт |
|---|---|---|
| 1 | Өөрийн feed дээрх бэлтгэлийг устгах, бүх бэлтгэлээ харах | Өөрийн пост дээр Edit / Delete; Profile → My training history. Устгасан бэлтгэл feed болон хамтрагчдын холбогдсон түүхээс хасагдана. |
| 2 | Feed → profile | Avatar болон username дээр дарж profile нээнэ. |
| 3 | Profile-ийн workout, оноо, competition, club, belt | Public profile дээр сүүлийн 30 public workout, энэ сарын leaderboard-ийн оноо/байр, тэмцээн, клуб, бүс, bio харагдана. Өөрийн бүх бэлтгэл private history-д байна. |
| 4 | Profile-ийн мэдээллийг нуух/харуулах | Edit profile дээр workout, оноо, competition, friends-ийн тусдаа switch. Клуб, бүс үргэлж харагдана. Утас, хаяг, төрсөн огноо public profile-д орохгүй. |
| 5 | Edit profile UI ба хажуу тийш эвдэрдэг scroll | Хэмжээ хязгаарласан field/grid/card; photo хэсэг, мэдээллийн бүлэг, sticky footer; гар утасны өргөнд багтана. |
| 6 | Хэвтээ menu-ийн scroll хадгалах | Menu-г гүйлгэсэн байрлал тухайн app session дотор хадгалагдана. |
| 7 | Өөр хуудас нээхэд дээрээс эхлэх | Tab, section, public profile, training history болон technique/body/competition-ийн дэд хуудас солиход босоо scroll reset хийнэ. |
| 8 | Camera permission дахин дахин асуух | Хуудас нээх бүрд шинэ permission request хийхгүй. Эхний удаад Open camera дарна; зөвшөөрсөн эсвэл амьд stream байвал дахин ашиглана. Хаахад track pause; 30 секундэд, background/logout үед бүрэн stop. Browser-ийн permission-г app хүчээр байнгын болгож чадахгүй. |
| 9 | App эхлэх splash | Хар дэвсгэр дээр цагаан ARROW BJJ. Account мэдээлэл ачаалагдаж дуусахад арилна; login/recovery-г хаахгүй. |
| 10 | Feed-ийн хажууд Leaderboard | Feed / Leaderboard гэсэн navigation. Эхний 12 постоор хязгаарлахгүй, сарын feed document-уудаас сервер дээр нийлбэр гаргана. Нэг public бэлтгэл нэг оноо. |
| 11 | Profile дотор friends | Зөвшөөрсөн найзуудын avatar/username, profile руу орох боломж; Discover тусдаа. |
| 12 | Хуудасны layout-тай skeleton | Feed, club, public profile, leaderboard болон partner history-д shimmer; “Loading” гэсэн харагдах text ашиглахгүй. Reduced motion тохиргоог дэмжинэ. |
| 13 | Finish training-ийн duration | 30/45/60/90/120 минут, өөрийн duration, tracker зогсоосон бодит хугацаа. Зогсоосон секунд болон эхэлсэн/дууссан timestamp хадгална. |
| 14 | Cancel / Save доорх илүү зай | Compact sticky footer, safe-area padding; доорх давхар зайг арилгасан. |
| 15 | Өнгөт effort slider | 1–5 slider; өнгө, effort-ийн нэр болон тоо зэрэг харагдана. |
| 16 | Partner эхэнд, дугуй avatar, username, хоёр талд нэмэгдэх | Partner сонголт form-ийн эхэнд. Tap → selection; save → хамтрагчийн linked history-д шууд нэмэгдэнэ. Түүх/profile нээхэд, app foreground болох үед болон харагдаж буй history/profile дээр 30 секунд тутам шинэчлэгдэнэ. Хамтрагч өөрийн private log эсвэл leaderboard-д давхар тоологдохгүй; өөрийн түүхээс нууж болно. |

## Өгөгдөл, шалгалт

- `/api/community` нь Supabase-ийн caller JWT-ээр клубийн гишүүн, social-ийн насны хязгаар, устгах эзэмшигчийг шалгана. Service-role key шаардахгүй.
- Public profile projection нь зөвхөн сонгосон мэдээллийг нийтэлнэ; friends/private workout, private notes, бодит нэр, төрсөн огноо, холбоо барих мэдээллийг хуулдаггүй.
- Partner projection нь зөвхөн огноо, төрөл, минут, rounds, эх сурвалж/хамтрагчдын ID агуулна. Өөр хүний private `bjj/u/.../log`-д шууд бичихгүй.
- Feed delete нь optimistic revision check ашигладаг; нэг өдөр олон partner session байвал date + path cursor алгасахгүй.
- Хуучин shared-doc RLS-ийн хязгаарлалт [ADMIN-SETUP.md](ADMIN-SETUP.md)-д тайлбарлагдсан. API-ийн хяналт нь хуучин Supabase shared-doc эрхийг өөрчилсөн гэсэн үг биш.

Шалгалтууд: `community-api.test.js`, `arrow-v9-community-smoke.py`, `arrow-v9-loading-smoke.py`; мөн feed, check-in, admin API болон V3–V8 browser regression. Browser/API fixtures ашигладаг тул production хэрэглэгчийн мэдээллийг өөрчлөхгүй.
