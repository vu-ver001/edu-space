package com.eduspace.backend.reporting.service.impl;

import com.eduspace.backend.reporting.dto.response.DashboardStatisticsResponse;
import com.eduspace.backend.reporting.entity.DailyBookingSummary;
import com.eduspace.backend.reporting.service.ExcelExportService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@Slf4j
public class ExcelExportServiceImpl implements ExcelExportService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @Override
    public byte[] generateStatisticsExcel(DashboardStatisticsResponse stats, List<DailyBookingSummary> dailySummaries) {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bao_Cao_Thong_Ke");
            sheet.setDisplayGridlines(true);

            // Setup Color Palette
            byte[] primaryBlueRgb = new byte[] { (byte) 30, (byte) 64, (byte) 175 }; // #1E40AF (EduSpace Navy)
            byte[] lightBlueRgb = new byte[] { (byte) 239, (byte) 246, (byte) 255 }; // #EFF6FF
            byte[] tableHeaderRgb = new byte[] { (byte) 241, (byte) 245, (byte) 249 }; // #F1F5F9
            byte[] zebraRowRgb = new byte[] { (byte) 248, (byte) 250, (byte) 252 }; // #F8FAFC
            byte[] borderGrayRgb = new byte[] { (byte) 203, (byte) 213, (byte) 225 }; // #CBD5E1

            XSSFColor primaryBlue = new XSSFColor(primaryBlueRgb, null);
            XSSFColor lightBlue = new XSSFColor(lightBlueRgb, null);
            XSSFColor tableHeaderColor = new XSSFColor(tableHeaderRgb, null);
            XSSFColor zebraRowColor = new XSSFColor(zebraRowRgb, null);
            XSSFColor borderGrayColor = new XSSFColor(borderGrayRgb, null);

            // Fonts
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontName("Calibri");
            titleFont.setFontHeightInPoints((short) 16);
            titleFont.setBold(true);
            titleFont.setColor(IndexedColors.WHITE.getIndex());

            XSSFFont subTitleFont = workbook.createFont();
            subTitleFont.setFontName("Calibri");
            subTitleFont.setFontHeightInPoints((short) 11);
            subTitleFont.setColor(primaryBlue);
            subTitleFont.setBold(true);

            XSSFFont sectionFont = workbook.createFont();
            sectionFont.setFontName("Calibri");
            sectionFont.setFontHeightInPoints((short) 12);
            sectionFont.setBold(true);
            sectionFont.setColor(primaryBlue);

            XSSFFont headerFont = workbook.createFont();
            headerFont.setFontName("Calibri");
            headerFont.setFontHeightInPoints((short) 11);
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.BLACK.getIndex());

            XSSFFont dataFont = workbook.createFont();
            dataFont.setFontName("Calibri");
            dataFont.setFontHeightInPoints((short) 11);

            XSSFFont boldDataFont = workbook.createFont();
            boldDataFont.setFontName("Calibri");
            boldDataFont.setFontHeightInPoints((short) 11);
            boldDataFont.setBold(true);

            // Styles
            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleStyle.setFillForegroundColor(primaryBlue);
            titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle orgHeaderStyle = workbook.createCellStyle();
            orgHeaderStyle.setFont(subTitleFont);
            orgHeaderStyle.setAlignment(HorizontalAlignment.LEFT);
            orgHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle sectionHeaderStyle = workbook.createCellStyle();
            sectionHeaderStyle.setFont(sectionFont);
            sectionHeaderStyle.setFillForegroundColor(lightBlue);
            sectionHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            sectionHeaderStyle.setAlignment(HorizontalAlignment.LEFT);
            sectionHeaderStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            XSSFCellStyle tableHeaderStyle = createBaseCellStyle(workbook, headerFont, borderGrayColor);
            tableHeaderStyle.setFillForegroundColor(tableHeaderColor);
            tableHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            tableHeaderStyle.setAlignment(HorizontalAlignment.CENTER);

            XSSFCellStyle dataLeftStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            dataLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            XSSFCellStyle dataRightStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            dataRightStyle.setAlignment(HorizontalAlignment.RIGHT);

            XSSFCellStyle dataCenterStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            dataCenterStyle.setAlignment(HorizontalAlignment.CENTER);

            XSSFCellStyle boldCenterStyle = createBaseCellStyle(workbook, boldDataFont, borderGrayColor);
            boldCenterStyle.setAlignment(HorizontalAlignment.CENTER);

            XSSFCellStyle boldRightStyle = createBaseCellStyle(workbook, boldDataFont, borderGrayColor);
            boldRightStyle.setAlignment(HorizontalAlignment.RIGHT);

            XSSFCellStyle zebraLeftStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            zebraLeftStyle.setFillForegroundColor(zebraRowColor);
            zebraLeftStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            zebraLeftStyle.setAlignment(HorizontalAlignment.LEFT);

            XSSFCellStyle zebraRightStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            zebraRightStyle.setFillForegroundColor(zebraRowColor);
            zebraRightStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            zebraRightStyle.setAlignment(HorizontalAlignment.RIGHT);

            XSSFCellStyle zebraCenterStyle = createBaseCellStyle(workbook, dataFont, borderGrayColor);
            zebraCenterStyle.setFillForegroundColor(zebraRowColor);
            zebraCenterStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            zebraCenterStyle.setAlignment(HorizontalAlignment.CENTER);

            int rowIdx = 0;

            // Row 0: Sub Header Organization
            Row orgRow = sheet.createRow(rowIdx++);
            orgRow.setHeightInPoints(22);
            Cell orgCell = orgRow.createCell(0);
            orgCell.setCellValue("HỆ THỐNG QUẢN LÝ KHÔNG GIAN HỌC TẬP EDUSPACE");
            orgCell.setCellStyle(orgHeaderStyle);

            // Determine if full month
            boolean isFullMonth = false;
            String monthYearLabel = "";
            if (stats.getFromDate() != null && stats.getToDate() != null) {
                LocalDate start = stats.getFromDate().toLocalDate();
                LocalDate end = stats.getToDate().toLocalDate();
                if (start.getYear() == end.getYear() && start.getMonth() == end.getMonth()
                        && start.getDayOfMonth() == 1 && end.getDayOfMonth() == end.lengthOfMonth()) {
                    isFullMonth = true;
                    monthYearLabel = String.format("%02d/%d", start.getMonthValue(), start.getYear());
                }
            }

            // Row 1: Main Title Banner
            Row titleRow = sheet.createRow(rowIdx++);
            titleRow.setHeightInPoints(36);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue(isFullMonth
                    ? "BÁO CÁO THỐNG KÊ VẬN HÀNH THÁNG " + monthYearLabel
                    : "BÁO CÁO THỐNG KÊ VẬN HÀNH & HIỆU SUẤT ĐẶT CHỖ");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 8));

            rowIdx++; // Empty space

            // Metadata Block
            String fromStr = stats.getFromDate() != null ? stats.getFromDate().format(DATE_FMT) : "Toàn bộ";
            String toStr = stats.getToDate() != null ? stats.getToDate().format(DATE_FMT) : "Hiện tại";
            String exportedAtStr = LocalDateTime.now().format(DATE_TIME_FMT);
            String calculatedAtStr = stats.getCalculatedAt() != null ? stats.getCalculatedAt().format(DATE_TIME_FMT)
                    : exportedAtStr;

            if (isFullMonth) {
                createMetaRow(sheet, rowIdx++, "Kỳ báo cáo thống kê:",
                        "Tháng " + monthYearLabel + " (" + fromStr + "  đến  " + toStr + ")", boldDataFont);
            } else {
                createMetaRow(sheet, rowIdx++, "Khoảng thời gian thống kê:", fromStr + "  đến  " + toStr, boldDataFont);
            }
            createMetaRow(sheet, rowIdx++, "Thời điểm tính toán dữ liệu gần nhất:", calculatedAtStr, dataFont);
            createMetaRow(sheet, rowIdx++, "Thời điểm xuất báo cáo:", exportedAtStr, dataFont);
            createMetaRow(sheet, rowIdx++, "Người tạo báo cáo:", "Ban Quản lý Hệ thống EduSpace (Admin/Staff)",
                    dataFont);

            rowIdx++; // Empty space

            // ==========================================
            // Section 1: KPI Vận Hành Chính
            // ==========================================
            createSectionHeader(sheet, rowIdx++, "I. CÁC CHỈ SỐ VẬN HÀNH CHÍNH (KPI TỔNG QUAN)", sectionHeaderStyle, 8);

            String[] kpiHeaders = { "STT", "Chỉ số vận hành", "Giá trị ghi nhận", "Đơn vị tính",
                    "Đánh giá & Ghi chú nghiệp vụ" };
            createTableHeader(sheet, rowIdx++, kpiHeaders, tableHeaderStyle);

            Object[][] kpiData = {
                    { 1, "Tổng số lượt đặt phòng", stats.getTotalBookings(), "lượt",
                            "Tổng nhu cầu đặt chỗ trong khoảng thời gian" },
                    { 2, "Tỷ lệ sử dụng thực tế (Check-in & Hoàn thành)", stats.getActualUsageRate() + "%", "%",
                            "Hiệu suất khai thác không gian học tập" },
                    { 3, "Tỷ lệ vắng mặt (No-Show)", stats.getNoShowRate() + "%", "%",
                            "Đặt chỗ nhưng không đến làm thủ tục check-in" },
                    { 4, "Yêu cầu đang chờ phê duyệt", stats.getPendingApprovalCount(), "yêu cầu",
                            "Đang chờ nhân viên Staff/Admin xử lý duyệt phòng" },
                    { 5, "Yêu cầu chờ duyệt bị quá hạn (Expired)", stats.getExpiredPendingCount(), "yêu cầu",
                            "Hết hạn trước khi được duyệt (cần cải thiện tốc độ duyệt)" },
                    { 6, "Tổng tài nguyên bảo trì / ngừng phục vụ", stats.getTotalMaintenanceCount(), "tài nguyên",
                            "Bao gồm Phòng học, Bàn nhóm và Ghế ngồi" }
            };

            for (int i = 0; i < kpiData.length; i++) {
                Row r = sheet.createRow(rowIdx++);
                r.setHeightInPoints(20);
                boolean isZebra = i % 2 == 1;
                XSSFCellStyle cStyle = isZebra ? zebraCenterStyle : dataCenterStyle;
                XSSFCellStyle lStyle = isZebra ? zebraLeftStyle : dataLeftStyle;
                XSSFCellStyle rStyle = isZebra ? zebraRightStyle : dataRightStyle;

                createCell(r, 0, String.valueOf(kpiData[i][0]), cStyle);
                createCell(r, 1, String.valueOf(kpiData[i][1]), lStyle);
                createCell(r, 2, String.valueOf(kpiData[i][2]), rStyle);
                createCell(r, 3, String.valueOf(kpiData[i][3]), cStyle);
                createCell(r, 4, String.valueOf(kpiData[i][4]), lStyle);
            }

            rowIdx++; // Empty space

            // ==========================================
            // Section 2: Chi Tiết Trạng Thái Booking
            // ==========================================
            createSectionHeader(sheet, rowIdx++, "II. PHÂN BỔ CHI TIẾT THEO TRẠNG THÁI ĐẶT PHÒNG (BOOKING STATUS)",
                    sectionHeaderStyle, 8);

            String[] statusHeaders = { "STT", "Trạng thái đặt phòng", "Mã kỹ thuật", "Số lượng", "Tỷ lệ (%)",
                    "Tác động nghiệp vụ" };
            createTableHeader(sheet, rowIdx++, statusHeaders, tableHeaderStyle);

            long total = stats.getTotalBookings() != null ? stats.getTotalBookings() : 0;
            Object[][] statusData = {
                    { 1, "Hoàn thành", "COMPLETED", stats.getCompletedCount(),
                            calcPercent(stats.getCompletedCount(), total), "Sinh viên đã hoàn tất buổi sử dụng" },
                    { 2, "Đang sử dụng (Check-in)", "CHECKED_IN", stats.getCheckedInCount(),
                            calcPercent(stats.getCheckedInCount(), total), "Đã check-in thành công tại quầy" },
                    { 3, "Đã xác nhận", "CONFIRMED", stats.getConfirmedCount(),
                            calcPercent(stats.getConfirmedCount(), total),
                            "Đã được duyệt/giữ chỗ thành công, chờ đến giờ" },
                    { 4, "Chờ phê duyệt", "PENDING_APPROVAL", stats.getPendingApprovalCount(),
                            calcPercent(stats.getPendingApprovalCount(), total), "Đang chờ nhân viên vận hành duyệt" },
                    { 5, "Không đến", "NO_SHOW", stats.getNoShowCount(),
                            calcPercent(stats.getNoShowCount(), total), "Không đến check-in trong khung giờ quy định" },
                    { 6, "Đã hủy", "CANCELLED", stats.getCancelledCount(),
                            calcPercent(stats.getCancelledCount(), total),
                            "Người dùng chủ động hủy trước giờ bắt đầu" },
                    { 7, "Bị từ chối", "REJECTED", stats.getRejectedCount(),
                            calcPercent(stats.getRejectedCount(), total), "Bị nhân viên từ chối kèm lý do" },
                    { 8, "Chờ duyệt quá hạn", "EXPIRED", stats.getExpiredPendingCount(),
                            calcPercent(stats.getExpiredPendingCount(), total),
                            "Hết hạn trước khi nhân viên kịp duyệt" }
            };

            for (int i = 0; i < statusData.length; i++) {
                Row r = sheet.createRow(rowIdx++);
                r.setHeightInPoints(20);
                boolean isZebra = i % 2 == 1;
                XSSFCellStyle cStyle = isZebra ? zebraCenterStyle : dataCenterStyle;
                XSSFCellStyle lStyle = isZebra ? zebraLeftStyle : dataLeftStyle;
                XSSFCellStyle rStyle = isZebra ? zebraRightStyle : dataRightStyle;

                createCell(r, 0, String.valueOf(statusData[i][0]), cStyle);
                createCell(r, 1, String.valueOf(statusData[i][1]), lStyle);
                createCell(r, 2, String.valueOf(statusData[i][2]), cStyle);
                createCell(r, 3, String.valueOf(statusData[i][3]), rStyle);
                createCell(r, 4, String.valueOf(statusData[i][4]), cStyle);
                createCell(r, 5, String.valueOf(statusData[i][5]), lStyle);
            }

            rowIdx++; // Empty space

            // ==========================================
            // Section 3: Bảo Trì Tài Nguyên Đa Bảng (Tổng hợp & Danh sách chi tiết)
            // ==========================================
            createSectionHeader(sheet, rowIdx++,
                    "III. TÌNH TRẠNG BẢO TRÌ & TÀI NGUYÊN TẠM NGỪNG PHỤC VỤ (PHÒNG / BÀN / GHẾ)", sectionHeaderStyle,
                    8);

            // Bảng 3.A: Tổng hợp số lượng
            String[] maintSummaryHeaders = { "STT", "Loại tài nguyên", "Nguồn dữ liệu CSDL", "Số lượng",
                    "Đánh giá tổng quan" };
            createTableHeader(sheet, rowIdx++, maintSummaryHeaders, tableHeaderStyle);

            Object[][] maintSummaryData = {
                    { 1, "Phòng học / Không gian chung", "spaces (MAINTENANCE) & maintenance_blocks",
                            stats.getMaintenanceSpacesCount() + " phòng",
                            stats.getMaintenanceSpacesCount() > 0 ? "Có phòng đang sửa chữa / khóa lịch bảo trì"
                                    : "Hoạt động bình thường" },
                    { 2, "Cụm bàn nhóm", "space_tables (INACTIVE)",
                            (stats.getMaintenanceTablesCount() != null ? stats.getMaintenanceTablesCount() : 0)
                                    + " bàn",
                            (stats.getMaintenanceTablesCount() != null && stats.getMaintenanceTablesCount() > 0)
                                    ? "Có cụm bàn tạm ngừng đón khách"
                                    : "Sẵn sàng sử dụng" },
                    { 3, "Vị trí ghế ngồi cá nhân", "seats (INACTIVE)",
                            (stats.getMaintenanceSeatsCount() != null ? stats.getMaintenanceSeatsCount() : 0) + " ghế",
                            (stats.getMaintenanceSeatsCount() != null && stats.getMaintenanceSeatsCount() > 0)
                                    ? "Có vị trí ghế hỏng / chờ thay thế"
                                    : "Sẵn sàng sử dụng" }
            };

            for (int i = 0; i < maintSummaryData.length; i++) {
                Row r = sheet.createRow(rowIdx++);
                r.setHeightInPoints(20);
                boolean isZebra = i % 2 == 1;
                XSSFCellStyle cStyle = isZebra ? zebraCenterStyle : dataCenterStyle;
                XSSFCellStyle lStyle = isZebra ? zebraLeftStyle : dataLeftStyle;
                XSSFCellStyle rStyle = isZebra ? zebraRightStyle : dataRightStyle;

                createCell(r, 0, String.valueOf(maintSummaryData[i][0]), cStyle);
                createCell(r, 1, String.valueOf(maintSummaryData[i][1]), lStyle);
                createCell(r, 2, String.valueOf(maintSummaryData[i][2]), lStyle);
                createCell(r, 3, String.valueOf(maintSummaryData[i][3]), rStyle);
                createCell(r, 4, String.valueOf(maintSummaryData[i][4]), lStyle);
            }

            rowIdx++; // Empty space

            // Bảng 3.B: Danh sách chi tiết từng phòng, bàn, ghế đang bảo trì
            Row subSecRow = sheet.createRow(rowIdx++);
            subSecRow.setHeightInPoints(22);
            Cell subSecCell = subSecRow.createCell(0);
            subSecCell.setCellValue("DANH SÁCH CHI TIẾT TỪNG PHÒNG, BÀN, GHẾ ĐANG BẢO TRÌ / TẠM NGỪNG");
            XSSFCellStyle subSecStyle = workbook.createCellStyle();
            subSecStyle.setFont(boldDataFont);
            subSecStyle.setAlignment(HorizontalAlignment.LEFT);
            subSecCell.setCellStyle(subSecStyle);

            String[] detailHeaders = { "STT", "Loại tài nguyên", "Mã tài nguyên", "Tên tài nguyên",
                    "Thuộc không gian (Phòng)", "Vị trí", "Lý do / Tình trạng", "Thời gian hiệu lực" };
            createTableHeader(sheet, rowIdx++, detailHeaders, tableHeaderStyle);

            java.util.List<com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse> details = stats
                    .getMaintenanceDetails();
            if (details != null && !details.isEmpty()) {
                for (int i = 0; i < details.size(); i++) {
                    com.eduspace.backend.reporting.dto.response.MaintenanceResourceDetailResponse item = details.get(i);
                    Row r = sheet.createRow(rowIdx++);
                    r.setHeightInPoints(20);
                    boolean isZebra = i % 2 == 1;
                    XSSFCellStyle cStyle = isZebra ? zebraCenterStyle : dataCenterStyle;
                    XSSFCellStyle lStyle = isZebra ? zebraLeftStyle : dataLeftStyle;

                    String periodStr = "Toàn thời gian (Tạm khóa)";
                    if (item.getStartTime() != null && item.getEndTime() != null) {
                        periodStr = item.getStartTime().format(DATE_FMT) + " đến " + item.getEndTime().format(DATE_FMT);
                    }

                    createCell(r, 0, String.valueOf(i + 1), cStyle);
                    createCell(r, 1, item.getResourceType(), cStyle);
                    createCell(r, 2, item.getResourceCode(), cStyle);
                    createCell(r, 3, item.getResourceName(), lStyle);
                    createCell(r, 4, item.getSpaceName() != null ? item.getSpaceName() : item.getSpaceCode(), lStyle);
                    createCell(r, 5, item.getLocation(), lStyle);
                    createCell(r, 6, item.getReason(), lStyle);
                    createCell(r, 7, periodStr, cStyle);
                }
            } else {
                Row emptyR = sheet.createRow(rowIdx++);
                emptyR.setHeightInPoints(20);
                Cell c = emptyR.createCell(0);
                c.setCellValue("Hiện tại toàn bộ phòng học, bàn nhóm và ghế ngồi đều đang hoạt động bình thường.");
                c.setCellStyle(dataLeftStyle);
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 7));
            }

            rowIdx++; // Empty space

            // ==========================================
            // Section 4: Bảng Kê Chi Tiết Từng Ngày
            // ==========================================
            if (dailySummaries != null && !dailySummaries.isEmpty()) {
                createSectionHeader(sheet, rowIdx++, "IV. BẢNG KÊ CHI TIẾT SỐ LIỆU THEO TỪNG NGÀY (DAILY BREAKDOWN)",
                        sectionHeaderStyle, 8);

                String[] dailyHeaders = { "STT", "Ngày thống kê", "Tổng đặt", "Hoàn thành", "Đang dùng", "Chờ duyệt",
                        "Vắng mặt", "Đã hủy", "Từ chối" };
                createTableHeader(sheet, rowIdx++, dailyHeaders, tableHeaderStyle);

                long sumTotal = 0, sumCompleted = 0, sumCheckedIn = 0, sumPending = 0, sumNoShow = 0, sumCancelled = 0,
                        sumRejected = 0;

                for (int i = 0; i < dailySummaries.size(); i++) {
                    DailyBookingSummary s = dailySummaries.get(i);
                    Row r = sheet.createRow(rowIdx++);
                    r.setHeightInPoints(20);
                    boolean isZebra = i % 2 == 1;
                    XSSFCellStyle cStyle = isZebra ? zebraCenterStyle : dataCenterStyle;
                    XSSFCellStyle rStyle = isZebra ? zebraRightStyle : dataRightStyle;

                    createCell(r, 0, String.valueOf(i + 1), cStyle);
                    createCell(r, 1, s.getStatDate().format(DATE_FMT), cStyle);
                    createCell(r, 2, String.valueOf(s.getTotalBookings()), rStyle);
                    createCell(r, 3, String.valueOf(s.getCompletedCount()), rStyle);
                    createCell(r, 4, String.valueOf(s.getCheckedInCount()), rStyle);
                    createCell(r, 5, String.valueOf(s.getPendingApprovalCount()), rStyle);
                    createCell(r, 6, String.valueOf(s.getNoShowCount()), rStyle);
                    createCell(r, 7, String.valueOf(s.getCancelledCount()), rStyle);
                    createCell(r, 8, String.valueOf(s.getRejectedCount()), rStyle);

                    sumTotal += s.getTotalBookings();
                    sumCompleted += s.getCompletedCount();
                    sumCheckedIn += s.getCheckedInCount();
                    sumPending += s.getPendingApprovalCount();
                    sumNoShow += s.getNoShowCount();
                    sumCancelled += s.getCancelledCount();
                    sumRejected += s.getRejectedCount();
                }

                // Summary Total Row
                Row totalRow = sheet.createRow(rowIdx++);
                totalRow.setHeightInPoints(22);
                createCell(totalRow, 0, "", boldCenterStyle);
                createCell(totalRow, 1, "TỔNG CỘNG", boldCenterStyle);
                createCell(totalRow, 2, String.valueOf(sumTotal), boldRightStyle);
                createCell(totalRow, 3, String.valueOf(sumCompleted), boldRightStyle);
                createCell(totalRow, 4, String.valueOf(sumCheckedIn), boldRightStyle);
                createCell(totalRow, 5, String.valueOf(sumPending), boldRightStyle);
                createCell(totalRow, 6, String.valueOf(sumNoShow), boldRightStyle);
                createCell(totalRow, 7, String.valueOf(sumCancelled), boldRightStyle);
                createCell(totalRow, 8, String.valueOf(sumRejected), boldRightStyle);
            }

            // Auto-size columns with padding
            for (int c = 0; c <= 8; c++) {
                sheet.autoSizeColumn(c);
                int currentWidth = sheet.getColumnWidth(c);
                sheet.setColumnWidth(c, Math.max(currentWidth + 1200, 3200));
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel thống kê: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi trong quá trình tạo file báo cáo Excel: " + e.getMessage(), e);
        }
    }

    private void createMetaRow(Sheet sheet, int rowIdx, String label, String value, XSSFFont font) {
        Row r = sheet.createRow(rowIdx);
        r.setHeightInPoints(19);

        Cell labelCell = r.createCell(0);
        labelCell.setCellValue(label);
        CellStyle labelStyle = sheet.getWorkbook().createCellStyle();
        XSSFFont labelFont = (XSSFFont) sheet.getWorkbook().createFont();
        labelFont.setBold(true);
        labelFont.setFontName("Calibri");
        labelFont.setFontHeightInPoints((short) 11);
        labelStyle.setFont(labelFont);
        labelCell.setCellStyle(labelStyle);

        Cell valCell = r.createCell(2);
        valCell.setCellValue(value);
        CellStyle valStyle = sheet.getWorkbook().createCellStyle();
        valStyle.setFont(font);
        valCell.setCellStyle(valStyle);
    }

    private void createSectionHeader(Sheet sheet, int rowIdx, String title, CellStyle style, int colSpan) {
        Row r = sheet.createRow(rowIdx);
        r.setHeightInPoints(26);
        Cell c = r.createCell(0);
        c.setCellValue(title);
        c.setCellStyle(style);
        sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, colSpan));
    }

    private void createTableHeader(Sheet sheet, int rowIdx, String[] headers, CellStyle style) {
        Row r = sheet.createRow(rowIdx);
        r.setHeightInPoints(24);
        for (int i = 0; i < headers.length; i++) {
            Cell c = r.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(style);
        }
    }

    private void createCell(Row row, int colIdx, String value, CellStyle style) {
        Cell c = row.createCell(colIdx);
        c.setCellValue(value);
        c.setCellStyle(style);
    }

    private XSSFCellStyle createBaseCellStyle(XSSFWorkbook workbook, XSSFFont font, XSSFColor borderColor) {
        XSSFCellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setTopBorderColor(borderColor);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(borderColor);
        style.setBorderLeft(BorderStyle.THIN);
        style.setLeftBorderColor(borderColor);
        style.setBorderRight(BorderStyle.THIN);
        style.setRightBorderColor(borderColor);
        return style;
    }

    private String calcPercent(Long count, long total) {
        if (count == null || count == 0 || total == 0)
            return "0%";
        double p = Math.round(((double) count / total * 100.0) * 10.0) / 10.0;
        return p + "%";
    }
}
