let activities = [];

let editIndex = -1;

const addBtn = document.getElementById("addBtn");

// ลำดับวันในสัปดาห์ (Monday ถึง Sunday)
const DAY_ORDER = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const TH_DAYS = ["จันทร์","อังคาร","พุธ","พฤหัสบดี","ศุกร์","เสาร์","อาทิตย์"];

const EN_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// โหลดข้อมูลที่บันทึกไว้
try {
    activities = JSON.parse(localStorage.getItem("plannerActivities") || "[]");
} catch(e){
    activities = [];
}

// บันทึกข้อมูลลง localStorage
function saveActivities(){
    try {
        localStorage.setItem("plannerActivities", JSON.stringify(activities));
    } catch(e){}
}

// เพิ่มกิจกรรม
function addActivity(){

    let day = document.getElementById("day").value;
    let start = document.getElementById("start").value;
    let end = document.getElementById("end").value;
    let activity = document.getElementById("activity").value;
    let color = document.getElementById("color").value;

    if(start=="" || end=="" || activity==""){
        alert("กรุณากรอกข้อมูลให้ครบ");
        return;
    }

    if(end <= start){
        alert("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม");
        return;
    }

    if(editIndex >= 0){
        // โหมดแก้ไข: แทนที่กิจกรรมเดิม
        activities[editIndex] = { day, start, end, activity, color };
        resetEdit();
    }else{
        activities.push({ day, start, end, activity, color });
    }

    saveActivities();

    showList();

    document.getElementById("activity").value="";

}

// แสดงรายการกิจกรรม
function showList(){

    let list = document.getElementById("list");

    let html = "";

    if(activities.length === 0){
        html = `<li class="list-item empty">ยังไม่มีกิจกรรม — เพิ่มกิจกรรมด้านบน</li>`;
    }

    activities.forEach(function(item, i){

        let di = dayIndex(item.day);
        let dayShort = (di < TH_DAYS.length) ? TH_DAYS[di] : escapeHtml(item.day);

        html += `
        <li class="list-item">
            <span class="color-dot" style="background:${escapeHtml(item.color)};"></span>
            <span class="list-info">
                <span class="day-chip">${dayShort}</span>
                <span class="list-time">${escapeHtml(item.start)} – ${escapeHtml(item.end)}</span>
                <span class="list-activity">${escapeHtml(item.activity)}</span>
            </span>
            <span class="list-actions">
                <button class="small" onclick="editActivity(${i})" title="แก้ไข">✏️</button>
                <button class="small danger" onclick="deleteActivity(${i})" title="ลบ">🗑️</button>
            </span>
        </li>
        `;

    });

    list.innerHTML = html;

    generateGrid();

}

// แก้ไขกิจกรรม: นำข้อมูลกลับไปที่ฟอร์ม
function editActivity(i){

    let item = activities[i];

    document.getElementById("day").value = item.day;
    document.getElementById("start").value = item.start;
    document.getElementById("end").value = item.end;
    document.getElementById("activity").value = item.activity;
    document.getElementById("color").value = item.color;

    editIndex = i;

    addBtn.innerHTML = "💾 บันทึกการแก้ไข<br>Save Edit";
    addBtn.classList.add("editing");

    document.querySelector(".form").scrollIntoView({behavior:"smooth"});
    document.getElementById("activity").focus();

}

// ลบกิจกรรม
function deleteActivity(i){

    if(!confirm("ลบกิจกรรมนี้?\nDelete this activity?")) return;

    activities.splice(i,1);

    if(editIndex === i){
        resetEdit();
    }else if(editIndex > i){
        editIndex--;
    }

    saveActivities();
    showList();

}

// ล้างทั้งหมด
function clearAll(){

    if(activities.length === 0) return;

    if(!confirm("ล้างรายการทั้งหมด?\nClear all activities?")) return;

    activities = [];
    resetEdit();
    saveActivities();
    showList();

}

// กลับสู่โหมดเพิ่มกิจกรรมปกติ
function resetEdit(){
    editIndex = -1;
    addBtn.innerHTML = "➕ เพิ่มกิจกรรม<br>Add Activity";
    addBtn.classList.remove("editing");
}

// ประมวลผลตาราง
function generateTable(){

    let result = document.getElementById("result");

    result.innerHTML="";

    if(activities.length === 0){
        result.innerHTML = `<tr><td colspan="4">ยังไม่มีกิจกรรม — เพิ่มกิจกรรมด้านบนก่อน</td></tr>`;
    }else{

        activities.sort(function(a,b){

            let dayDiff = dayIndex(a.day) - dayIndex(b.day);

            if(dayDiff != 0){
                return dayDiff;
            }

            return a.start.localeCompare(b.start);

        });

        activities.forEach(function(item){

            result.innerHTML += `
            <tr>

                <td>${escapeHtml(item.day)}</td>

                <td>${escapeHtml(item.start)}</td>

                <td>${escapeHtml(item.end)}</td>

                <td style="background:${escapeHtml(item.color)};font-weight:bold;">
                    ${escapeHtml(item.activity)}
                </td>

            </tr>
            `;

        });

    }

    // สรุปเวลาว่าง
    let stats = freeTimeStats();

    result.innerHTML += `
        <tr class="free-summary-row">
            <td colspan="4">
                ⏳ เวลาว่างทั้งตาราง: ${stats.totalFreePct}%
                (ช่วง ${formatHour(stats.range.minStart)} – ${formatHour(stats.range.maxEnd)})
            </td>
        </tr>
        `;

}

// ดาวน์โหลด PNG (ตารางปกติ)
function downloadPNG(){

    html2canvas(document.getElementById("schedule")).then(function(canvas){

        let link=document.createElement("a");

        link.download="Schedule.png";

        link.href=canvas.toDataURL("image/png");

        link.click();

    });

}

// ดาวน์โหลด PNG (ตารางรายสัปดาห์)
function downloadGridPNG(){

    html2canvas(document.getElementById("gridSection")).then(function(canvas){

        let link=document.createElement("a");

        link.download="WeeklySchedule.png";

        link.href=canvas.toDataURL("image/png");

        link.click();

    });

}

// สร้างตารางรายสัปดาห์ (Weekly Grid)
function generateGrid(){

    let grid = document.getElementById("grid");

    if(!grid) return;

    // ช่วงเวลาที่จะแสดง + สรุปเวลาว่าง
    let range = getRange();
    let total = range.total;
    let stats = freeTimeStats();

    updateFreeSummary(stats);

    let html = "";

    // แถวหัวข้อเวลา
    html += `<div class="grid-row grid-header">`;

    html += `<div class="grid-day-label">เวลา<br><small>Time</small></div>`;

    for(let h = range.minStart; h < range.maxEnd; h += 60){
        html += `<div class="grid-hour">${formatHour(h)}</div>`;
    }

    html += `</div>`;

    // แต่ละวัน
    DAY_ORDER.forEach(function(dayName, di){

        let dayActs = activities
            .filter(function(a){ return dayIndex(a.day) === di; })
            .sort(function(a,b){ return toMinutes(a.start) - toMinutes(b.start); });

        // ช่วงเวลาที่ไม่ว่าง (รวมที่ซ้อนกัน) และช่วงเวลาว่าง
        let merged = mergeIntervals(dayActs, range.minStart, range.maxEnd);
        let freeSegs = getFreeSegments(merged, range.minStart, range.maxEnd);
        let freePct = stats.perDay[di].freePct;

        // จัดกลุ่มกิจกรรมที่เวลาซ้อนกัน (cluster)
        let clusters = [];
        let cur = [];
        let curEnd = -1;

        dayActs.forEach(function(a){
            let s = toMinutes(a.start);
            if(cur.length > 0 && s >= curEnd){
                clusters.push(cur);
                cur = [];
            }
            cur.push(a);
            curEnd = Math.max(curEnd, toMinutes(a.end));
        });

        if(cur.length > 0){
            clusters.push(cur);
        }

        // คำนวณตำแหน่งกล่องกิจกรรม
        let blocks = [];
        let maxCols = 1;

        clusters.forEach(function(cluster){

            let colsInfo = assignColumns(cluster);

            let clStart = Infinity;
            let clEnd = -Infinity;

            cluster.forEach(function(a){
                let s = toMinutes(a.start);
                let e = toMinutes(a.end);
                if(s < clStart) clStart = s;
                if(e > clEnd) clEnd = e;
            });

            let clLeft = (clStart - range.minStart)/total*100;
            let colWidth = (clEnd - clStart)/total*100 / colsInfo.maxCols;

            cluster.forEach(function(a, i){

                blocks.push({
                    a: a,
                    left: clLeft + colsInfo.result[i]*colWidth + 0.25,
                    width: colWidth - 0.5,
                    col: colsInfo.result[i]
                });

            });

            if(colsInfo.maxCols > maxCols) maxCols = colsInfo.maxCols;

        });

        let trackHeight = Math.max(90, maxCols*26 + 16);

        html += `<div class="grid-row">`;

        html += `<div class="grid-day-label">${TH_DAYS[di]}<br><small>${EN_DAYS[di]}</small><small class="free-pct">ว่าง ${freePct}%</small></div>`;

        html += `<div class="grid-track" style="height:${trackHeight}px;">`;

        // เส้นบอกชั่วโมง
        for(let h = range.minStart; h <= range.maxEnd; h += 60){
            let left = (h - range.minStart)/total*100;
            html += `<div class="grid-line" style="left:${left}%"></div>`;
        }

        // ช่องว่าง (เวลาว่าง)
        freeSegs.forEach(function(f){

            let left = (f.s - range.minStart)/total*100;
            let width = (f.e - f.s)/total*100;

            html += `
            <div class="grid-block grid-free"
                 style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%;top:2px;height:22px;"
                 title="ว่าง (${formatHour(f.s)} - ${formatHour(f.e)})">
                ว่าง
            </div>`;

        });

        // กล่องกิจกรรม
        blocks.forEach(function(b){

            html += `
            <div class="grid-block"
                 style="left:${b.left.toFixed(2)}%;width:${b.width.toFixed(2)}%;top:${b.col*26 + 2}px;height:22px;background:${escapeHtml(b.a.color)};"
                 title="${escapeHtml(b.a.activity)} (${b.a.start} - ${b.a.end})">
                ${escapeHtml(b.a.activity)}
            </div>`;

        });

        html += `</div>`;

        html += `</div>`;

    });

    grid.innerHTML = html;

}

// หาช่วงเวลาที่จะแสดง (ปัดเป็นชั่วโมง)
function getRange(){

    let minStart = 6*60;
    let maxEnd = 22*60;

    if(activities.length > 0){

        minStart = Infinity;
        maxEnd = -Infinity;

        activities.forEach(function(a){
            let s = toMinutes(a.start);
            let e = toMinutes(a.end);
            if(s < minStart) minStart = s;
            if(e > maxEnd) maxEnd = e;
        });

        minStart = Math.floor(minStart/60)*60;
        maxEnd = Math.ceil(maxEnd/60)*60;

        if(maxEnd - minStart < 60) maxEnd = minStart + 60;

    }

    return { minStart: minStart, maxEnd: maxEnd, total: maxEnd - minStart };

}

// รวมช่วงเวลาที่ซ้อนกัน (หน่วยนาที)
function mergeIntervals(dayActs, minStart, maxEnd){

    let intervals = dayActs
        .map(function(a){ return { s: toMinutes(a.start), e: toMinutes(a.end) }; })
        .sort(function(a,b){ return a.s - b.s; });

    let merged = [];

    intervals.forEach(function(iv){

        let s = Math.max(iv.s, minStart);
        let e = Math.min(iv.e, maxEnd);

        if(e <= s) return;

        let last = merged[merged.length-1];

        if(last && s <= last.e){
            if(e > last.e) last.e = e;
        }else{
            merged.push({ s: s, e: e });
        }

    });

    return merged;

}

// หาช่วงเวลาว่างระหว่างกิจกรรม (หน่วยนาที)
function getFreeSegments(merged, minStart, maxEnd){

    let free = [];
    let cursor = minStart;

    merged.forEach(function(iv){

        if(iv.s > cursor){
            free.push({ s: cursor, e: iv.s });
        }

        if(iv.e > cursor) cursor = iv.e;

    });

    if(cursor < maxEnd){
        free.push({ s: cursor, e: maxEnd });
    }

    return free;

}

// คำนวณเวลาว่าง (เปอร์เซ็นต์)
function freeTimeStats(){

    let range = getRange();
    let totalMin = range.total;
    let totalFree = 0;

    let perDay = DAY_ORDER.map(function(dayName, di){

        let dayActs = activities.filter(function(a){ return dayIndex(a.day) === di; });

        let merged = mergeIntervals(dayActs, range.minStart, range.maxEnd);

        let busy = 0;
        merged.forEach(function(iv){ busy += iv.e - iv.s; });

        let free = Math.max(0, totalMin - busy);
        totalFree += free;

        return {
            day: TH_DAYS[di],
            free: free,
            freePct: Math.round(free/totalMin*100)
        };

    });

    return {
        range: range,
        perDay: perDay,
        totalFreePct: Math.round(totalFree/(totalMin*7)*100)
    };

}

// แสดงสรุปเวลาว่าง
function updateFreeSummary(stats){

    let box = document.getElementById("freeSummary");

    if(!box) return;

    let busyPct = 100 - stats.totalFreePct;

    box.innerHTML = `
        <div class="free-overall">
            <span class="free-title">
                📊 เวลาว่างโดยรวม: <b>${stats.totalFreePct}%</b>
                <small>(ช่วง ${formatHour(stats.range.minStart)} – ${formatHour(stats.range.maxEnd)})</small>
            </span>
            <div class="free-bar">
                <div class="free-bar-busy" style="width:${busyPct}%;"></div>
            </div>
            <span class="free-bar-legend">
                <span class="dot busy"></span> ไม่ว่าง ${busyPct}%
                <span class="dot free"></span> ว่าง ${stats.totalFreePct}%
            </span>
        </div>
    `;

}

// ลำดับวันในสัปดาห์ (Monday ถึง Sunday)
function dayIndex(day){

    for(let i=0;i<DAY_ORDER.length;i++){
        if(day.indexOf(DAY_ORDER[i]) === 0) return i;
    }

    return DAY_ORDER.length;

}

// แปลง "HH:MM" เป็นจำนวนนาที
function toMinutes(time){

    let parts = time.split(":");

    return parseInt(parts[0],10)*60 + parseInt(parts[1],10);

}

// แปลงจำนวนนาทีเป็น "HH:MM"
function formatHour(minutes){

    let h = Math.floor(minutes/60);
    let m = minutes%60;

    return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");

}

// จัดคอลัมน์ให้กิจกรรมที่ซ้อนกัน (แบบ Google Calendar)
function assignColumns(dayActs){

    let ends = [];       // เวลาสิ้นสุดของแต่ละคอลัมน์
    let result = [];     // คอลัมน์ของแต่ละกิจกรรม

    dayActs.forEach(function(a){

        let s = toMinutes(a.start);
        let e = toMinutes(a.end);

        let col = -1;

        for(let i=0;i<ends.length;i++){
            if(ends[i] <= s){
                col = i;
                break;
            }
        }

        if(col === -1){
            col = ends.length;
            ends.push(e);
        }else{
            ends[col] = e;
        }

        result.push(col);

    });

    return { result: result, maxCols: Math.max(1, ends.length) };

}

// ป้องกันการแทรก HTML จากข้อมูลที่ผู้ใช้กรอก
function escapeHtml(text){

    return String(text)
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#39;");

}

// แสดงผลครั้งแรก
showList();
