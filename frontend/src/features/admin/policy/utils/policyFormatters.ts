export interface PolicyDetailItem {
  label: string;
  value: string;
  key: string;
}

export function parsePolicyText(rawValue?: string | null): PolicyDetailItem[] {
  if (!rawValue) return [];

  // 1. Trường hợp chuỗi JSON cũ
  if (rawValue.trim().startsWith('{') && rawValue.trim().endsWith('}')) {
    try {
      const data = JSON.parse(rawValue);
      const items: PolicyDetailItem[] = [];
      if (data.openingHour && data.closingHour) {
        items.push({
          key: 'hours',
          label: 'Khung giờ hoạt động',
          value: `${data.openingHour} – ${data.closingHour}`,
        });
      }
      if (data.maxDurationMinutes) {
        const mins = Number(data.maxDurationMinutes);
        const hours = Math.floor(mins / 60);
        const remMins = mins % 60;
        const durationText = remMins > 0 ? `${hours} giờ ${remMins} phút` : `${hours} giờ`;
        items.push({
          key: 'duration',
          label: 'Thời lượng tối đa',
          value: `${durationText} (${mins} phút)`,
        });
      }
      if (data.maxBookingsPerDay) {
        items.push({
          key: 'quota',
          label: 'Hạn mức đặt chỗ',
          value: `${data.maxBookingsPerDay} lượt / sinh viên / ngày`,
        });
      }
      if (data.checkInEarlyOpenMinutes || data.checkInGraceMinutes) {
        items.push({
          key: 'checkin',
          label: 'Quy định check-in',
          value: `Mở trước ${data.checkInEarlyOpenMinutes || 15} phút, ân hạn trễ ${data.checkInGraceMinutes || 15} phút`,
        });
      }
      if (items.length > 0) return items;
    } catch {
      // Bỏ qua lỗi parse JSON
    }
  }

  // 2. Trường hợp chuỗi phân tách "|" từ backend mới
  if (rawValue.includes('|')) {
    return rawValue
      .split('|')
      .map((item, idx) => {
        const parts = item.split(':');
        if (parts.length >= 2) {
          const label = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          let key = `field_${idx}`;
          if (label.includes('Khung giờ')) key = 'hours';
          else if (label.includes('Thời lượng')) key = 'duration';
          else if (label.includes('Hạn mức')) key = 'quota';
          else if (label.includes('Check-in')) key = 'checkin';
          return { key, label, value };
        }
        return { key: `item_${idx}`, label: '', value: item.trim() };
      })
      .filter((x) => Boolean(x.value));
  }

  // 3. Trường hợp chuỗi Java PolicyResponse(...) từ các bản ghi cũ
  if (rawValue.includes('PolicyResponse(')) {
    const getVal = (regex: RegExp) => {
      const match = rawValue.match(regex);
      return match ? match[1] : null;
    };

    const opening = getVal(/openingHour=([^,\)]+)/);
    const closing = getVal(/closingHour=([^,\)]+)/);
    const maxDuration = getVal(/maxDurationMinutes=(\d+)/);
    const quota = getVal(/maxBookingsPerDay=(\d+)/);
    const early = getVal(/checkInEarlyOpenMinutes=(\d+)/);
    const grace = getVal(/checkInGraceMinutes=(\d+)/);

    const items: PolicyDetailItem[] = [];
    if (opening && closing) {
      items.push({
        key: 'hours',
        label: 'Khung giờ hoạt động',
        value: `${opening} – ${closing}`,
      });
    }
    if (maxDuration) {
      const mins = parseInt(maxDuration, 10);
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      const durationText = remMins > 0 ? `${hours} giờ ${remMins} phút` : `${hours} giờ`;
      items.push({
        key: 'duration',
        label: 'Thời lượng tối đa',
        value: `${durationText} (${mins} phút)`,
      });
    }
    if (quota) {
      items.push({
        key: 'quota',
        label: 'Hạn mức đặt chỗ',
        value: `${quota} lượt / sinh viên / ngày`,
      });
    }
    if (early || grace) {
      items.push({
        key: 'checkin',
        label: 'Quy định check-in',
        value: `Mở trước ${early || 15} phút, ân hạn trễ ${grace || 15} phút`,
      });
    }
    if (items.length > 0) return items;
  }

  return [{ key: 'raw', label: 'Nội dung', value: rawValue }];
}
