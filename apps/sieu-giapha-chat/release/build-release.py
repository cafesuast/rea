# Bản phát hành chính thức (thương mại): bỏ toàn bộ dữ liệu demo và ví dụ cá nhân. Dùng: python3 gp/release.py <vào> <ra>
import re,sys
src,dst=sys.argv[1],sys.argv[2];s=open(src,encoding="utf-8").read()
def rep(a,b,n=1):
  global s
  c=s.count(a)
  if c!=n:raise SystemExit(f"anchor {c}x (cần {n}): {a[:70]}")
  s=s.replace(a,b)
# 1. Gia đình mẫu 17 người: bỏ hẳn
i=s.index("const DEMO=[ /*");j=s.index("].map(([id,name,gender",i);s=s[:i]+"const DEMO=["+s[j:]
rep('people=(OPT.demo===false?[]:DEMO)','people=[]')
rep('Bản xem thử với dữ liệu mẫu: mọi thay đổi chỉ giữ trong lúc trang đang mở.','Chưa kết nối được kho dữ liệu: thay đổi chỉ giữ trong lúc trang đang mở.')
rep(' người là dữ liệu mẫu (họ Lê). <button id="clearSample">Xóa dữ liệu mẫu</button> khi bạn bắt đầu nhập gia phả thật.',' người là dữ liệu mẫu cũ. <button id="clearSample">Xóa dữ liệu mẫu</button>')
s=re.sub(r'\s*\["Dữ liệu mẫu họ Lê là gì\?","[^"]*"\],','',s,count=1)
rep('Đang ở chế độ khách: xem được dữ liệu mẫu, chưa có gia phả riêng và chưa có bot.','Đang ở chế độ khách: tra được từ điển và lịch sử dòng họ chung, chưa có gia phả riêng và chưa có bot.')
# 2. Ví dụ gắn với một dòng họ cụ thể: đổi sang ví dụ chung
rep('"VD: Tộc Lê (Bối Khê)"','"VD: Tộc Nguyễn (tên làng quê gốc)"')
rep('ls.get("gdFolder","GIAPHA LE BOIKE")','ls.get("gdFolder","")')
rep('placeholder="Tên thư mục, VD: GIAPHA LE BOIKE"','placeholder="Tên thư mục, VD: GIA PHA HO NGUYEN"')
rep('placeholder="Tìm tên hoặc mã, VD: LE-BOIKHE-D12"','placeholder="Tìm tên hoặc mã, VD: NGUYEN-QUEGOC-D12"')
rep('VD: Ảnh chụp gia phả Tộc Lê Bối Khê, bản chép tay năm 1969','VD: Ảnh chụp gia phả họ tôi, bản chép tay của ông nội')
# Tên ví dụ trong hướng dẫn: dùng tên chung chung
for a,b in [("Lê Văn Phúc","Nguyễn Văn An"),("Nguyễn Thị Hạnh","Trần Thị Bình"),("Lê Văn Minh","Nguyễn Văn Cường")]:s=s.replace(a,b)
# 4. Điều khoản cho bản chính thức (thương mại): phiên bản 2, người dùng cũ phải đồng ý lại
rep('const TERMS_V=1;','const TERMS_V=2;const SGP_OP=window.SGP_OPERATOR||{name:"Đơn vị vận hành Siêu GiaPha",contact:"(điền email hỗ trợ chính thức)"};')
rep('["Mục đích","Siêu GiaPha chat là dự án cộng đồng, phi lợi nhuận, xây dựng Siêu Từ Điển Việt – Việt – Anh và Cây gia phả Việt Nam."]',
 '["Đơn vị vận hành và mục đích",SGP_OP.name+" vận hành Siêu GiaPha (gồm Siêu Gia Phả và Siêu Từ Điển) để xây dựng Siêu Từ Điển Việt – Việt – Anh và Cây gia phả Việt Nam. Một số tính năng có thể thu phí; giá và quyền lợi luôn được nêu rõ trước khi bạn trả tiền. Liên hệ: "+SGP_OP.contact+"."]')
rep('["Thay đổi và luật áp dụng",','["Quyền của bạn với dữ liệu cá nhân","Bạn có quyền xem, sửa, tải về, xóa dữ liệu của mình và rút lại sự đồng ý bất cứ lúc nào trong Cài đặt, hoặc gửi yêu cầu tới địa chỉ liên hệ ở trên. App chỉ xử lý dữ liệu cá nhân cho đúng mục đích đã nêu và không bán dữ liệu cá nhân của bạn."],\n ["Thay đổi và luật áp dụng",')
# 5. Link mời trỏ về bản chính thức; tên trang
rep('const APP_LINK="https://claude.ai/artifact/CLY5d1T6dVzCHdiiNs5Cwk";','const APP_LINK=window.SGP_APP_LINK||"https://claude.ai/artifact/QnpFCfJB3y7jXTu2YSYzK6";')
s=re.sub(r"<title>[^<]*</title>","<title>Siêu GiaPha</title>",s,count=1)
# 3. Đánh dấu bản phát hành
if 'SGP_RELEASE' not in s:s=s.replace('<script>','<script>window.SGP_RELEASE={v:"1.0.0",at:"2026-11-01",channel:"official"};',1)
for bad in ["Bối Khê","BOIKE","BOIKHE","Lê Văn Phúc","Nguyễn Thị Hạnh","Lê Gia Bảo","Võ Minh Khang","Bảo Sơn"]:
  if bad in s:raise SystemExit("còn sót: "+bad)
open(dst,"w",encoding="utf-8").write(s);print("release ok",len(s)//1024,"KB")
