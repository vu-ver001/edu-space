-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: eduspace
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `eduspace`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `eduspace` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `eduspace`;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `performed_at` datetime(6) NOT NULL,
  `performed_by` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 7 - 22 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-24 09:33:03.807713','admin@eduspace.vn','1','POLICY'),(2,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-24 09:33:10.577428','admin@eduspace.vn','1','POLICY'),(3,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 07:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-24 10:00:24.489364','admin@eduspace.vn','1','POLICY'),(4,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-24 10:00:35.008017','admin@eduspace.vn','1','POLICY'),(5,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-24 10:01:34.463317','admin@eduspace.vn','1','POLICY'),(6,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-28 11:08:54.961016','admin@eduspace.vn','1','POLICY'),(7,'UPDATE_POLICY','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 2 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-28 11:09:00.663137','admin@eduspace.vn','1','POLICY'),(8,'UPDATE_POLICY','Khung giờ: 07:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','Khung giờ: 08:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-28 11:09:11.941407','admin@eduspace.vn','1','POLICY'),(9,'UPDATE_POLICY','Khung giờ: 07:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 20p, ân hạn 15p','Khung giờ: 07:00 - 22:00 | Thời lượng tối đa: 3 giờ | Hạn mức: 2 lượt/ngày | Check-in: trước 15p, ân hạn 15p','2026-09-28 11:09:27.282252','admin@eduspace.vn','1','POLICY');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_audit_logs`
--

DROP TABLE IF EXISTS `booking_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `performed_by` bigint DEFAULT NULL,
  `performed_at` datetime NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` text COLLATE utf8mb4_unicode_ci,
  `performed_by_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_audit_user` (`performed_by`),
  KEY `idx_audit_booking` (`booking_id`),
  CONSTRAINT `fk_audit_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=173 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_audit_logs`
--

LOCK TABLES `booking_audit_logs` WRITE;
/*!40000 ALTER TABLE `booking_audit_logs` DISABLE KEYS */;
INSERT INTO `booking_audit_logs` VALUES (1,1,'CREATE_BOOKING',3,'2026-09-14 07:00:00','Sinh viên tạo yêu cầu','Phòng không yêu cầu duyệt -> Xác nhận ngay CONFIRMED',NULL),(2,2,'CREATE_BOOKING',3,'2026-09-14 07:30:00','Sinh viên tạo yêu cầu','Phòng thuyết trình -> Chuyển sang PENDING_APPROVAL chờ Staff duyệt',NULL),(3,1,'NO_SHOW_TIMEOUT',NULL,'2026-09-14 15:21:11','CHECKIN_DEADLINE_EXCEEDED','Quá thời hạn check-in (15 phút sau giờ bắt đầu) -> Đánh dấu NO_SHOW',NULL),(4,3,'CREATE_BOOKING',3,'2026-09-14 15:27:45','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(5,4,'CREATE_BOOKING',3,'2026-09-14 15:29:08','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL',NULL),(6,4,'APPROVE_BOOKING',2,'2026-09-14 15:29:22','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED',NULL),(7,4,'CANCEL_BOOKING',3,'2026-09-14 15:29:51','Doi_ke_hoach_hoc_tap','Giải phóng phòng cho sinh viên khác',NULL),(8,5,'CREATE_BOOKING',3,'2026-09-14 15:30:29','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL',NULL),(9,5,'REJECT_BOOKING',2,'2026-09-14 15:31:08','Khong du dieu kien to chuc su kien quy mo lon trong phong nay','Từ chối yêu cầu và giải phóng phòng',NULL),(10,6,'CREATE_BOOKING',3,'2026-09-14 15:44:07','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(11,6,'NO_SHOW_TIMEOUT',NULL,'2026-09-14 16:15:11','CHECKIN_DEADLINE_EXCEEDED','Quá thời hạn check-in (15 phút sau giờ bắt đầu) -> Đánh dấu NO_SHOW',NULL),(12,7,'CREATE_BOOKING',3,'2026-09-15 08:23:47','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(13,8,'CREATE_BOOKING',3,'2026-09-15 10:00:49','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(14,9,'CREATE_BOOKING',3,'2026-09-15 10:06:52','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(15,10,'CREATE_BOOKING',6,'2026-09-15 10:06:52','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED',NULL),(16,7,'NO_SHOW_TIMEOUT',NULL,'2026-09-16 11:06:19','CHECKIN_DEADLINE_EXCEEDED','Quá thời hạn check-in (15 phút sau giờ bắt đầu) -> Đánh dấu NO_SHOW',NULL),(17,2,'EXPIRE_TIMEOUT',NULL,'2026-09-17 07:33:06','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(26,19,'CREATE_BOOKING',4,'2026-09-17 08:05:15','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(27,20,'CREATE_BOOKING',4,'2026-09-17 08:05:15','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(28,21,'CREATE_BOOKING',3,'2026-09-17 08:05:15','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','anhvu@eduspace.vn'),(29,22,'CREATE_BOOKING',4,'2026-09-17 08:05:15','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(30,23,'CREATE_BOOKING',3,'2026-09-17 08:05:15','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','anhvu@eduspace.vn'),(31,24,'CREATE_BOOKING',4,'2026-09-17 09:25:05','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(32,25,'CREATE_BOOKING',4,'2026-09-17 09:27:54','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(33,26,'CREATE_BOOKING',4,'2026-09-17 09:31:13','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(34,27,'CREATE_BOOKING',4,'2026-09-17 09:33:24','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(35,27,'CANCEL_BOOKING',4,'2026-09-17 10:20:53','Doi_ke_hoach','Giải phóng phòng cho sinh viên khác','khanhvan@eduspace.vn'),(36,28,'CREATE_BOOKING',4,'2026-09-17 22:23:59','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(37,28,'CANCEL_BOOKING',4,'2026-09-17 22:23:59','Thay đổi kế hoạch học nhóm','Giải phóng phòng cho sinh viên khác','khanhvan@eduspace.vn'),(38,29,'CREATE_BOOKING',4,'2026-09-17 22:23:59','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(39,29,'APPROVE_BOOKING',2,'2026-09-17 22:23:59','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(40,30,'CREATE_BOOKING',4,'2026-09-17 22:25:12','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(41,30,'CANCEL_BOOKING',4,'2026-09-17 22:25:12','Thay đổi kế hoạch học nhóm','Giải phóng phòng cho sinh viên khác','khanhvan@eduspace.vn'),(42,31,'CREATE_BOOKING',4,'2026-09-17 22:25:12','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(43,31,'APPROVE_BOOKING',2,'2026-09-17 22:25:12','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(44,26,'CANCEL_BOOKING',4,'2026-09-17 22:57:35','Thay_doi_ke_hoach_hoc_tap','Giải phóng phòng cho sinh viên khác','khanhvan@eduspace.vn'),(45,32,'CREATE_BOOKING',4,'2026-09-17 23:07:39','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(46,33,'CREATE_BOOKING',4,'2026-09-17 23:10:31','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(47,33,'APPROVE_BOOKING',2,'2026-09-17 23:17:05','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(48,3,'NO_SHOW_TIMEOUT',NULL,'2026-09-18 01:01:14','CHECKIN_DEADLINE_EXCEEDED','Quá thời hạn check-in (15 phút sau giờ bắt đầu) -> Đánh dấu NO_SHOW',NULL),(49,34,'CREATE_BOOKING',3,'2026-09-18 01:04:11','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(50,35,'CREATE_BOOKING',1,'2026-09-18 01:04:32','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','admin@eduspace.vn'),(51,36,'CREATE_BOOKING',3,'2026-09-18 15:15:54','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(52,37,'CREATE_BOOKING',4,'2026-09-18 15:24:32','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(53,38,'CREATE_BOOKING',4,'2026-09-18 21:20:46','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(54,39,'CREATE_BOOKING',4,'2026-09-18 21:23:07','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(55,40,'CREATE_BOOKING',4,'2026-09-18 21:39:06','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(56,41,'CREATE_BOOKING',4,'2026-09-18 21:42:25','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(57,42,'CREATE_BOOKING',4,'2026-09-18 21:43:07','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(58,43,'CREATE_BOOKING',4,'2026-09-18 21:43:07','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(61,19,'NO_SHOW_TIMEOUT',NULL,'2026-09-18 22:56:10','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(62,44,'CREATE_BOOKING',4,'2026-09-18 23:00:43','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','khanhvan@eduspace.vn'),(63,45,'CREATE_BOOKING',5,'2026-09-18 23:05:09','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','anhvu@eduspace.vn'),(64,46,'CREATE_BOOKING',5,'2026-09-18 23:05:09','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','anhvu@eduspace.vn'),(65,47,'CREATE_BOOKING',5,'2026-09-18 23:05:09','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','anhvu@eduspace.vn'),(66,45,'APPROVE_BOOKING',2,'2026-09-18 23:05:09','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(67,48,'CREATE_BOOKING',5,'2026-09-18 23:29:01','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','anhvu@eduspace.vn'),(68,49,'CREATE_BOOKING',2,'2026-09-18 23:31:47','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','staff@eduspace.vn'),(69,48,'EXPIRE_TIMEOUT',NULL,'2026-09-19 15:06:35','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(70,20,'NO_SHOW_TIMEOUT',NULL,'2026-09-19 15:06:35','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(71,21,'NO_SHOW_TIMEOUT',NULL,'2026-09-19 15:06:35','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(74,49,'EXPIRE_TIMEOUT',NULL,'2026-09-19 21:55:35','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(75,8,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 11:29:15','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(76,44,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 11:29:15','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(77,50,'CREATE_BOOKING',3,'2026-09-20 13:01:40','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(78,51,'CREATE_BOOKING',3,'2026-09-20 13:01:40','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(79,22,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 13:48:44','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(80,23,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 13:48:54','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(81,52,'CREATE_BOOKING',3,'2026-09-20 14:12:27','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(82,53,'CREATE_BOOKING',3,'2026-09-20 14:12:57','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(83,45,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 14:15:26','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(84,52,'EXPIRE_TIMEOUT',NULL,'2026-09-20 17:13:08','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(85,46,'NO_SHOW_TIMEOUT',NULL,'2026-09-20 17:13:27','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(86,53,'EXPIRE_TIMEOUT',NULL,'2026-09-20 22:53:56','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(87,32,'EXPIRE_TIMEOUT',NULL,'2026-09-21 11:07:47','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(88,9,'NO_SHOW_TIMEOUT',NULL,'2026-09-21 11:07:48','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(89,10,'NO_SHOW_TIMEOUT',NULL,'2026-09-21 11:07:48','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(90,54,'CREATE_BOOKING',4,'2026-09-21 11:33:24','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','khanhvan@eduspace.vn'),(91,54,'EXPIRE_TIMEOUT',NULL,'2026-09-21 12:44:09','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(92,47,'EXPIRE_TIMEOUT',NULL,'2026-09-21 14:00:18','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(93,31,'NO_SHOW_TIMEOUT',NULL,'2026-09-21 18:15:20','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(94,36,'NO_SHOW_TIMEOUT',NULL,'2026-09-22 12:44:17','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(95,41,'NO_SHOW_TIMEOUT',NULL,'2026-09-22 12:44:17','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(96,42,'EXPIRE_TIMEOUT',NULL,'2026-09-22 13:00:18','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(97,34,'NO_SHOW_TIMEOUT',NULL,'2026-09-22 15:24:52','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(98,35,'NO_SHOW_TIMEOUT',NULL,'2026-09-22 15:24:52','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(99,43,'EXPIRE_TIMEOUT',NULL,'2026-09-23 11:05:45','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(100,50,'NO_SHOW_TIMEOUT',NULL,'2026-09-23 11:05:52','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(101,51,'EXPIRE_TIMEOUT',NULL,'2026-09-23 14:00:22','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(102,33,'NO_SHOW_TIMEOUT',NULL,'2026-09-23 14:15:24','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(103,55,'CREATE_BOOKING',3,'2026-09-24 07:39:55','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(104,56,'CREATE_BOOKING',3,'2026-09-24 07:50:22','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(105,37,'NO_SHOW_TIMEOUT',NULL,'2026-09-24 08:15:16','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(107,58,'CREATE_BOOKING',3,'2026-09-24 09:58:02','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(108,58,'EXPIRE_TIMEOUT',NULL,'2026-09-24 10:00:06','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(109,59,'CREATE_BOOKING',3,'2026-09-24 10:02:05','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(110,59,'EXPIRE_TIMEOUT',NULL,'2026-09-24 11:00:05','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(111,60,'CREATE_BOOKING',3,'2026-09-24 12:57:31','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(112,61,'CREATE_BOOKING',3,'2026-09-24 12:57:32','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(113,62,'CREATE_BOOKING',3,'2026-09-24 13:02:12','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(114,62,'EXPIRE_TIMEOUT',NULL,'2026-09-24 14:00:11','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(115,29,'NO_SHOW_TIMEOUT',NULL,'2026-09-24 14:15:12','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(116,55,'EXPIRE_TIMEOUT',NULL,'2026-09-25 09:00:12','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(117,63,'CREATE_BOOKING',3,'2026-09-25 09:20:23','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(118,63,'EXPIRE_TIMEOUT',NULL,'2026-09-25 10:00:14','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(119,56,'EXPIRE_TIMEOUT',NULL,'2026-09-25 14:00:11','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(120,60,'EXPIRE_TIMEOUT',NULL,'2026-09-27 23:31:59','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(121,61,'NO_SHOW_TIMEOUT',NULL,'2026-09-27 23:31:59','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(122,64,'CREATE_BOOKING',3,'2026-09-27 23:36:41','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(123,64,'CANCEL_BOOKING',3,'2026-09-27 23:36:51','Người dùng chủ động hủy','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(124,65,'CREATE_BOOKING',3,'2026-09-27 23:39:24','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(125,66,'CREATE_BOOKING',3,'2026-09-27 23:40:52','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(126,65,'APPROVE_BOOKING',2,'2026-09-28 00:05:16','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(127,67,'CREATE_BOOKING',3,'2026-09-28 00:24:28','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(128,68,'CREATE_BOOKING',3,'2026-09-28 08:04:49','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(129,68,'APPROVE_BOOKING',2,'2026-09-28 08:30:53','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(130,67,'REJECT_BOOKING',2,'2026-09-28 08:33:05','fff','Từ chối yêu cầu và giải phóng phòng','staff@eduspace.vn'),(131,68,'NO_SHOW_TIMEOUT',NULL,'2026-09-28 09:27:42','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(132,69,'CREATE_BOOKING',3,'2026-09-28 10:55:53','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(133,69,'CHECK_IN',3,'2026-09-28 11:13:55','Xác nhận có mặt sử dụng phòng','Check-in thành công','student@eduspace.vn'),(134,69,'COMPLETE_TIMEOUT',NULL,'2026-09-28 13:04:42','SESSION_ENDED','Hết giờ sử dụng phòng -> Đánh dấu COMPLETED thành công','system@eduspace.vn'),(135,70,'CREATE_BOOKING',3,'2026-09-28 13:34:51','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(136,70,'NO_SHOW_TIMEOUT',NULL,'2026-09-28 13:50:14','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(137,71,'CREATE_BOOKING',3,'2026-09-28 14:30:26','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(138,71,'NO_SHOW_TIMEOUT',NULL,'2026-09-28 14:47:15','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(139,72,'CREATE_BOOKING',3,'2026-09-28 22:14:05','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(140,72,'APPROVE_BOOKING',2,'2026-09-28 22:14:25','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(141,73,'CREATE_BOOKING',3,'2026-09-28 22:15:02','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(142,73,'CANCEL_BOOKING',3,'2026-09-28 22:17:52','Người dùng chủ động hủy','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(143,74,'CREATE_BOOKING',3,'2026-09-28 22:18:26','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(144,74,'CANCEL_BOOKING',3,'2026-09-28 22:19:25','Người dùng chủ động hủy','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(145,75,'CREATE_BOOKING',3,'2026-09-28 22:19:55','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(146,76,'CREATE_BOOKING',3,'2026-09-28 22:58:51','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(147,77,'CREATE_BOOKING',3,'2026-09-28 23:00:02','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(148,78,'CREATE_BOOKING',3,'2026-09-28 23:23:46','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(149,78,'APPROVE_BOOKING',2,'2026-09-28 23:25:30','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(150,77,'REJECT_BOOKING',2,'2026-09-28 23:25:39','hhhh','Từ chối yêu cầu và giải phóng phòng','staff@eduspace.vn'),(151,78,'CANCEL_BOOKING',3,'2026-09-29 00:28:45','ee','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(152,66,'NO_SHOW_TIMEOUT',NULL,'2026-09-29 08:20:23','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(153,79,'CREATE_BOOKING',3,'2026-09-29 10:31:18','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(154,79,'CANCEL_BOOKING',3,'2026-09-29 10:31:39','mmmmmm','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(155,80,'CREATE_BOOKING',3,'2026-09-29 10:53:27','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(156,80,'EXPIRE_TIMEOUT',NULL,'2026-09-29 11:00:26','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(157,81,'CREATE_BOOKING',3,'2026-09-29 14:10:49','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(158,81,'EXPIRE_TIMEOUT',NULL,'2026-09-29 15:00:06','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(159,82,'CREATE_BOOKING',3,'2026-09-29 15:22:28','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(160,82,'EXPIRE_TIMEOUT',NULL,'2026-09-29 16:00:09','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(161,65,'NO_SHOW_TIMEOUT',NULL,'2026-09-29 20:19:02','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(162,83,'CREATE_BOOKING',3,'2026-09-30 10:38:23','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(163,72,'NO_SHOW_TIMEOUT',NULL,'2026-09-30 12:33:41','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(164,84,'CREATE_BOOKING',3,'2026-09-30 15:59:30','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(165,84,'APPROVE_BOOKING',2,'2026-09-30 15:59:50','Nhân viên vận hành phê duyệt','Chuyển trạng thái từ PENDING_APPROVAL sang CONFIRMED','staff@eduspace.vn'),(166,84,'NO_SHOW_TIMEOUT',NULL,'2026-09-30 16:15:03','CHECKIN_WINDOW_EXPIRED','Quá hạn check-in -> NO_SHOW','system@eduspace.vn'),(167,85,'CREATE_BOOKING',3,'2026-09-30 21:24:15','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(168,86,'CREATE_BOOKING',3,'2026-10-01 07:23:27','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn'),(169,75,'EXPIRE_TIMEOUT',NULL,'2026-10-01 08:00:12','PENDING_APPROVAL_TIMEOUT','Quá giờ bắt đầu nhưng Staff chưa xử lý -> Tự giải phóng phòng','system@eduspace.vn'),(170,87,'CREATE_BOOKING',3,'2026-10-01 09:26:23','Khởi tạo yêu cầu đặt phòng','Phòng yêu cầu duyệt -> PENDING_APPROVAL','student@eduspace.vn'),(171,83,'CANCEL_BOOKING',3,'2026-10-01 09:26:34','rr','Giải phóng phòng cho sinh viên khác','student@eduspace.vn'),(172,88,'CREATE_BOOKING',3,'2026-10-01 09:26:56','Khởi tạo yêu cầu đặt phòng','Phòng duyệt tự động -> CONFIRMED','student@eduspace.vn');
/*!40000 ALTER TABLE `booking_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_policies`
--

DROP TABLE IF EXISTS `booking_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_policies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `policy_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `policy_value` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `policy_key` (`policy_key`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_policies`
--

LOCK TABLES `booking_policies` WRITE;
/*!40000 ALTER TABLE `booking_policies` DISABLE KEYS */;
INSERT INTO `booking_policies` VALUES (1,'MAX_BOOKING_HOURS_PER_SLOT','3','Thời lượng đặt chỗ tối đa cho một lượt (giờ)','2026-09-14 14:40:50',NULL),(2,'DAILY_BOOKING_QUOTA','2','Hạn mức tối đa số booking đang chiếm chỗ của 1 sinh viên trong ngày','2026-09-28 11:09:27','admin@eduspace.vn'),(3,'RATE_LIMIT_HOURLY','10','Giới hạn số lần gửi yêu cầu đặt chỗ của 1 sinh viên trong 1 giờ','2026-09-28 11:09:27','admin@eduspace.vn'),(4,'CHECKIN_OPEN_MINUTES','20','Thời điểm mở cửa sổ check-in trước giờ bắt đầu (phút)','2026-09-28 11:09:27','admin@eduspace.vn'),(5,'CHECKIN_GRACE_MINUTES','15','Thời gian ân hạn sau giờ bắt đầu trước khi bị tính là No-show (phút)','2026-09-28 11:09:27','admin@eduspace.vn'),(6,'OPENING_HOUR','07:00','Giờ mở cửa phục vụ không gian học tập hàng ngày','2026-09-28 11:09:27','admin@eduspace.vn'),(7,'CLOSING_HOUR','22:00','Giờ đóng cửa không gian học tập hàng ngày','2026-09-28 11:09:27','admin@eduspace.vn'),(8,'MAX_ADVANCE_DAYS','7','Số ngày tối đa sinh viên được phép đặt trước','2026-09-14 14:40:50',NULL),(9,'MAX_DURATION_MINUTES','180',NULL,'2026-09-28 11:09:27','admin@eduspace.vn');
/*!40000 ALTER TABLE `booking_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `space_id` bigint NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `participant_count` int NOT NULL,
  `purpose` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `selected_seats` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `table_id` bigint DEFAULT NULL,
  `status` enum('CANCELLED','CHECKED_IN','COMPLETED','CONFIRMED','EXPIRED','NO_SHOW','PENDING_APPROVAL','REJECTED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `rejected_by` bigint DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `reject_reason` text COLLATE utf8mb4_unicode_ci,
  `expired_at` datetime DEFAULT NULL,
  `expire_reason` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checked_in_at` datetime DEFAULT NULL,
  `checked_in_by` bigint DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `booking_code` varchar(35) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq97166k18hklq6ls46osbrftx` (`booking_code`),
  KEY `fk_booking_rejector` (`rejected_by`),
  KEY `fk_booking_checkin_by` (`checked_in_by`),
  KEY `idx_space_status_time` (`space_id`,`status`,`start_time`,`end_time`),
  KEY `idx_student_status_time` (`student_id`,`status`,`start_time`,`end_time`),
  KEY `idx_booking_table_time` (`table_id`,`status`,`start_time`,`end_time`),
  KEY `idx_booking_status_start_time` (`status`,`start_time`),
  CONSTRAINT `fk_booking_checkin_by` FOREIGN KEY (`checked_in_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_rejector` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_booking_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_booking_table` FOREIGN KEY (`table_id`) REFERENCES `space_tables` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=89 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,3,2,'2026-09-14 14:00:00','2026-09-14 16:00:00',5,'Thảo luận đề tài bài tập lớn EduSpace',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-14 14:40:50','2026-09-14 15:21:11',NULL),(2,3,4,'2026-09-16 14:00:00','2026-09-16 16:30:00',18,'Thuyết trình thử nghiệm đồ án môn học',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-17 07:33:06','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-14 14:40:50','2026-09-17 07:33:06',NULL),(3,3,1,'2026-09-17 09:00:00','2026-09-17 11:00:00',4,'Hoc nhom do an chuyen nganh',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:27:45','2026-09-18 01:01:14',NULL),(4,3,4,'2026-09-18 14:00:00','2026-09-18 16:00:00',15,'Hoi thao nghien cuu khoa hoc sinh vien',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:29:08','2026-09-14 15:29:51',NULL),(5,3,5,'2026-09-19 10:00:00','2026-09-19 12:00:00',20,'Hoi thao CLB Cong nghe thong tin',NULL,NULL,'REJECTED',2,'2026-09-14 15:31:08','Khong du dieu kien to chuc su kien quy mo lon trong phong nay',NULL,NULL,NULL,NULL,'2026-09-14 15:30:29','2026-09-14 15:31:08',NULL),(6,3,1,'2026-09-14 16:00:00','2026-09-14 19:00:00',2,'Thảo luận đồ án môn học',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-14 15:44:07','2026-09-14 16:15:11',NULL),(7,3,1,'2026-09-15 18:00:00','2026-09-15 20:00:00',4,'Học nhóm môn Phát triển phần mềm dịch vụ [Vị trí chỗ ngồi: D4, D5]',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-15 08:23:48','2026-09-16 11:06:20',NULL),(8,3,1,'2026-09-20 10:00:00','2026-09-20 12:00:00',2,'Ôn tập đồ án tốt nghiệp','C1,C2',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-15 10:00:49','2026-09-20 11:29:15',NULL),(9,3,1,'2026-09-21 09:00:00','2026-09-21 11:00:00',2,'Ôn thi cuối kỳ','D1,D2',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-15 10:06:52','2026-09-21 11:07:48',NULL),(10,6,1,'2026-09-21 09:00:00','2026-09-21 11:00:00',2,'Học bài cùng bạn','D3,D4',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-15 10:06:52','2026-09-21 11:07:48',NULL),(19,4,5,'2026-09-18 14:00:00','2026-09-18 16:00:00',1,'Học tập tập trung tại Study Booth B-01',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 08:05:15','2026-09-18 22:56:10',NULL),(20,4,4,'2026-09-19 10:30:00','2026-09-19 12:30:00',1,'Học tại ghế S01','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 08:05:15','2026-09-19 15:06:35',NULL),(21,3,4,'2026-09-19 10:30:00','2026-09-19 12:30:00',1,'Học tại ghế S02','S02',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 08:05:15','2026-09-19 15:06:35',NULL),(22,4,7,'2026-09-20 13:30:00','2026-09-20 15:30:00',1,'Thảo luận nhóm tại Bàn T01','T01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 08:05:15','2026-09-20 13:48:44',NULL),(23,3,7,'2026-09-20 13:30:00','2026-09-20 15:30:00',1,'Thảo luận nhóm tại Bàn T02','T02',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 08:05:15','2026-09-20 13:48:54',NULL),(24,4,5,'2026-09-22 08:00:00','2026-09-22 10:00:00',2,'Học tập yên tĩnh tại Study Booth',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 09:25:05','2026-09-18 21:41:13',NULL),(25,4,3,'2026-09-22 14:00:00','2026-09-22 16:00:00',15,'Thuyết trình bảo vệ đồ án môn học',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 09:27:54','2026-09-18 21:41:13',NULL),(26,4,4,'2026-09-23 08:30:00','2026-09-23 10:30:00',1,'Tự học lập trình tại Khu tự học','S05',NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 09:31:13','2026-09-17 22:57:35',NULL),(27,4,7,'2026-09-23 14:00:00','2026-09-23 16:00:00',1,'Thảo luận nhóm bài tập lớn','T03',NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 09:33:24','2026-09-17 10:20:53',NULL),(28,4,1,'2026-09-24 08:00:00','2026-09-24 10:00:00',4,'Nhóm Khánh Vân làm đồ án PTPMDV',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 22:23:59','2026-09-17 22:23:59',NULL),(29,4,3,'2026-09-24 14:00:00','2026-09-24 16:00:00',10,'Tổ chức hội thảo chuyên đề khoa CNTT',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 22:23:59','2026-09-24 14:15:12',NULL),(30,4,1,'2026-09-21 14:00:00','2026-09-21 16:00:00',4,'Nhóm Khánh Vân làm đồ án PTPMDV',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 22:25:12','2026-09-17 22:25:12',NULL),(31,4,3,'2026-09-21 18:00:00','2026-09-21 20:00:00',10,'Tổ chức hội thảo chuyên đề khoa CNTT',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 22:25:12','2026-09-21 18:15:21',NULL),(32,4,3,'2026-09-21 08:00:00','2026-09-21 10:00:00',12,'Test 4.1',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-21 11:07:47','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-17 23:07:39','2026-09-21 11:07:47',NULL),(33,4,3,'2026-09-23 14:00:00','2026-09-23 16:00:00',12,'Hội thảo học thuật CLB Nghiên cứu Khoa học',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-17 23:10:31','2026-09-23 14:15:24',NULL),(34,3,7,'2026-09-22 14:00:00','2026-09-22 16:00:00',4,'Thao luan ban 2 sinh vien khac',NULL,2,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 01:04:11','2026-09-22 15:24:52',NULL),(35,1,7,'2026-09-22 14:30:00','2026-09-22 15:30:00',3,'Admin dat ban 3 hop le',NULL,3,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 01:04:32','2026-09-22 15:24:52',NULL),(36,3,1,'2026-09-22 08:00:00','2026-09-22 10:00:00',4,'Học nhóm môn Phát triển phần mềm dịch vụ',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 15:16:28','2026-09-22 12:44:17',NULL),(37,4,1,'2026-09-24 08:00:00','2026-09-24 10:00:00',4,'Khánh Vân đặt phòng học nhóm',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 15:24:32','2026-09-24 08:15:16',NULL),(38,4,4,'2026-09-20 08:00:00','2026-09-20 10:00:00',1,'Tự học cá nhân','S01',NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 21:20:46','2026-09-18 21:37:47',NULL),(39,4,4,'2026-09-23 08:00:00','2026-09-23 10:00:00',1,'Tự học cá nhân','S02',NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 21:23:07','2026-09-18 21:37:47',NULL),(40,4,7,'2026-09-23 08:00:00','2026-09-23 10:00:00',4,'Thảo luận nhóm bàn T02 môn EduSpace',NULL,2,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 21:39:06','2026-09-18 21:41:13',NULL),(41,4,4,'2026-09-22 08:00:00','2026-09-22 10:00:00',1,'Tự học cá nhân','S05',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 21:43:07','2026-09-22 12:44:17',NULL),(42,4,2,'2026-09-22 13:00:00','2026-09-22 15:00:00',3,'Học nhóm làm đồ án kiến trúc môn PTPMDV',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-22 13:00:18','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-18 21:43:07','2026-09-22 13:00:18',NULL),(43,4,7,'2026-09-23 08:00:00','2026-09-23 10:00:00',4,'Thảo luận nhóm bàn T02 môn EduSpace',NULL,2,'EXPIRED',NULL,NULL,NULL,'2026-09-23 11:05:45','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-18 21:43:07','2026-09-23 11:05:50',NULL),(44,4,4,'2026-09-20 08:00:00','2026-09-20 10:00:00',1,'Tự học cá nhân','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 23:00:43','2026-09-20 11:29:15',NULL),(45,5,1,'2026-09-20 14:00:00','2026-09-20 16:00:00',6,'Họp nhóm môn Phát triển phần mềm dịch vụ',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 23:05:09','2026-09-20 14:15:26',NULL),(46,5,4,'2026-09-20 16:30:00','2026-09-20 18:30:00',1,'Tự học cá nhân','S09',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-18 23:05:09','2026-09-20 17:13:27',NULL),(47,5,7,'2026-09-21 14:00:00','2026-09-21 16:00:00',4,'Học nhóm đồ án chuyên ngành',NULL,1,'EXPIRED',NULL,NULL,NULL,'2026-09-21 14:00:18','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-18 23:05:09','2026-09-21 14:00:18',NULL),(48,5,2,'2026-09-19 08:00:00','2026-09-19 10:00:00',4,'Thảo luận đề tài bài tập lớn môn PTPMDV',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-19 15:06:35','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-18 23:29:01','2026-09-19 15:06:35',NULL),(49,2,2,'2026-09-19 17:00:00','2026-09-19 19:00:00',4,'sss',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-19 21:55:35','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-18 23:31:47','2026-09-19 21:55:36',NULL),(50,3,4,'2026-09-23 10:00:00','2026-09-23 12:00:00',1,'Tự học cá nhân','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-20 13:01:40','2026-09-23 11:05:52',NULL),(51,3,1,'2026-09-23 14:00:00','2026-09-23 16:00:00',4,'Học nhóm ôn thi PTPMDV',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-23 14:00:22','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-20 13:01:40','2026-09-23 14:00:23',NULL),(52,3,1,'2026-09-20 17:00:00','2026-09-20 18:00:00',4,'ttt',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-20 17:13:08','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-20 14:12:27','2026-09-20 17:13:09',NULL),(53,3,2,'2026-09-20 18:00:00','2026-09-20 19:00:00',4,'ccccc',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-20 22:53:56','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-20 14:12:58','2026-09-20 22:53:56',NULL),(54,4,1,'2026-09-21 12:00:00','2026-09-21 14:00:00',4,'eee',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-21 12:44:09','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-21 11:33:24','2026-09-21 12:44:09',NULL),(55,3,1,'2026-09-25 09:00:00','2026-09-25 10:00:00',2,'Hoc nhom thao luan do an',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-25 09:00:12','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 07:39:56','2026-09-25 09:00:12','BK-260924-0001'),(56,3,1,'2026-09-25 14:00:00','2026-09-25 15:30:00',2,'Thao luan do an mon hoc',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-25 14:00:11','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 07:50:22','2026-09-25 14:00:11','BK-260924-0002'),(58,3,2,'2026-09-24 10:00:00','2026-09-24 12:00:00',4,'444',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-24 10:00:06','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 09:58:03','2026-09-24 10:00:06','BK-260924-0003'),(59,3,1,'2026-09-24 11:00:00','2026-09-24 13:00:00',4,'uuuuu',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-24 11:00:05','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 10:02:05','2026-09-24 11:00:05','BK-260924-0004'),(60,3,7,'2026-09-26 14:00:00','2026-09-26 16:00:00',1,'Thảo luận nhóm đề tài AI','T01',1,'EXPIRED',NULL,NULL,NULL,'2026-09-27 23:31:59','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 12:57:32','2026-09-27 23:31:59','BK-260924-0005'),(61,3,4,'2026-09-26 09:00:00','2026-09-26 11:00:00',1,'Tự học cá nhân','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-24 12:57:32','2026-09-27 23:31:59','BK-260924-0006'),(62,3,7,'2026-09-24 14:00:00','2026-09-24 16:00:00',1,'ww','T01',1,'EXPIRED',NULL,NULL,NULL,'2026-09-24 14:00:11','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-24 13:02:12','2026-09-24 14:00:11','BK-260924-0007'),(63,3,1,'2026-09-25 10:00:00','2026-09-25 12:00:00',4,'xxxxxxxxxx',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-25 10:00:14','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-25 09:20:23','2026-09-25 10:00:14','BK-260925-0001'),(64,3,1,'2026-09-28 08:00:00','2026-09-28 10:00:00',4,'mmmm',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-27 23:36:41','2026-09-27 23:36:51','BK-260927-0001'),(65,3,1,'2026-09-29 20:00:00','2026-09-29 22:00:00',4,'3333',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-27 23:39:24','2026-09-29 20:19:04','BK-260927-0002'),(66,3,4,'2026-09-29 08:00:00','2026-09-29 10:00:00',1,'Tự học tại chỗ ngồi','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-27 23:40:52','2026-09-29 08:20:23','BK-260927-0003'),(67,3,7,'2026-09-30 10:00:00','2026-09-30 12:00:00',1,'Thao luan nhom','T01',1,'REJECTED',2,'2026-09-28 08:33:05','fff',NULL,NULL,NULL,NULL,'2026-09-28 00:24:28','2026-09-28 08:33:05','BK-260928-0001'),(68,3,1,'2026-09-28 09:00:00','2026-09-28 11:00:00',4,'nnn',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 08:04:49','2026-09-28 09:27:42','BK-260928-0002'),(69,3,4,'2026-09-28 11:00:00','2026-09-28 13:00:00',1,'Tự học tại chỗ ngồi','S01',NULL,'COMPLETED',NULL,NULL,NULL,NULL,NULL,'2026-09-28 11:13:55',3,'2026-09-28 10:55:53','2026-09-28 13:04:42','BK-260928-0003'),(70,3,4,'2026-09-28 13:35:00','2026-09-28 13:40:00',1,'Tự học tại chỗ ngồi','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 13:34:51','2026-09-28 13:50:14','BK-260928-0004'),(71,3,4,'2026-09-28 14:32:00','2026-09-28 14:35:00',1,'Tự học tại chỗ ngồi','S01',NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 14:30:27','2026-09-28 14:47:15','BK-260928-0005'),(72,3,7,'2026-09-30 12:00:00','2026-09-30 14:00:00',1,'nnn','T02',2,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 22:14:05','2026-09-30 12:33:43','BK-260928-0006'),(73,3,7,'2026-09-30 17:00:00','2026-09-30 18:00:00',1,'222','T03',3,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 22:15:02','2026-09-28 22:17:52','BK-260928-0007'),(74,3,7,'2026-10-01 08:00:00','2026-10-01 10:00:00',1,'6666666','T03',3,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 22:18:26','2026-09-28 22:19:25','BK-260928-0008'),(75,3,7,'2026-10-01 08:00:00','2026-10-01 10:00:00',1,'3333','T03',3,'EXPIRED',NULL,NULL,NULL,'2026-10-01 08:00:12','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-28 22:19:55','2026-10-01 08:00:12','BK-260928-0009'),(76,3,3,'2026-10-02 08:00:00','2026-10-02 10:00:00',2,'hhh',NULL,NULL,'PENDING_APPROVAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 22:58:51','2026-09-28 22:58:51','BK-260928-0010'),(77,3,2,'2026-10-03 08:00:00','2026-10-03 10:00:00',2,'eeee',NULL,NULL,'REJECTED',2,'2026-09-28 23:25:39','hhhh',NULL,NULL,NULL,NULL,'2026-09-28 23:00:02','2026-09-28 23:25:39','BK-260928-0011'),(78,3,7,'2026-10-04 08:00:00','2026-10-04 10:00:00',5,'mmm','T02',2,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-28 23:23:46','2026-09-29 00:28:45','BK-260928-0012'),(79,3,1,'2026-10-02 12:00:00','2026-10-02 13:00:00',6,'...',NULL,NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-29 10:31:18','2026-09-29 10:31:39','BK-260929-0001'),(80,3,15,'2026-09-29 11:00:00','2026-09-29 13:00:00',8,'mmm','T04',5,'EXPIRED',NULL,NULL,NULL,'2026-09-29 11:00:26','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-29 10:53:27','2026-09-29 11:00:26','BK-260929-0002'),(81,3,2,'2026-09-29 15:00:00','2026-09-29 17:00:00',4,'ddd',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-29 15:00:06','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-29 14:10:49','2026-09-29 15:00:06','BK-260929-0003'),(82,3,1,'2026-09-29 16:00:00','2026-09-29 18:00:00',4,'aaa',NULL,NULL,'EXPIRED',NULL,NULL,NULL,'2026-09-29 16:00:09','PENDING_APPROVAL_TIMEOUT',NULL,NULL,'2026-09-29 15:22:28','2026-09-29 16:00:09','BK-260929-0004'),(83,3,4,'2026-10-02 10:00:00','2026-10-02 12:00:00',1,'wwww','S03',NULL,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-30 10:38:24','2026-10-01 09:26:34','BK-260930-0001'),(84,3,5,'2026-09-30 16:00:00','2026-09-30 18:00:00',1,'yyy',NULL,NULL,'NO_SHOW',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-30 15:59:31','2026-09-30 16:15:03','BK-260930-0002'),(85,3,40,'2026-10-04 08:00:00','2026-10-04 10:00:00',1,'mm','t4',21,'PENDING_APPROVAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-09-30 21:24:15','2026-09-30 21:24:15','BK-260930-0003'),(86,3,4,'2026-10-05 08:00:00','2026-10-05 10:00:00',1,'aaa','S04',NULL,'CONFIRMED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-01 07:23:27','2026-10-01 07:23:27','BK-261001-0001'),(87,3,3,'2026-10-01 10:00:00','2026-10-01 12:00:00',1,'rrr',NULL,NULL,'PENDING_APPROVAL',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-01 09:26:23','2026-10-01 09:26:23','BK-261001-0002'),(88,3,4,'2026-10-01 09:27:00','2026-10-01 10:00:00',1,'Tự học tại chỗ ngồi','S03',NULL,'CONFIRMED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-01 09:26:56','2026-10-01 09:26:56','BK-261001-0003');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkin_tokens`
--

DROP TABLE IF EXISTS `checkin_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkin_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `booking_id` bigint NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `issued_at` datetime(6) NOT NULL,
  `status` enum('ACTIVE','EXPIRED','USED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9ft95qdy9lamjp3f9q5myy9it` (`token_hash`),
  KEY `idx_checkin_token_booking_status` (`booking_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkin_tokens`
--

LOCK TABLES `checkin_tokens` WRITE;
/*!40000 ALTER TABLE `checkin_tokens` DISABLE KEYS */;
INSERT INTO `checkin_tokens` VALUES (1,71,'2026-09-28 14:47:00.000000','2026-09-28 14:32:52.722166','EXPIRED','65719d411901944f6c5330a40dec72a0c8a82d3fb9ae3f6e551375d72369b40b',NULL),(2,71,'2026-09-28 14:47:00.000000','2026-09-28 14:32:52.755751','EXPIRED','1e3bc953c2a3af51e23ac9767f597d7bb71ea77b0b85d9fc75292bb0c0d5e210',NULL),(3,71,'2026-09-28 14:47:00.000000','2026-09-28 14:45:07.453784','EXPIRED','e03f9f59b58cd0e76332c65069c1c09a704617f6530685b3832e67ede7fb412f',NULL),(4,71,'2026-09-28 14:47:00.000000','2026-09-28 14:45:07.566835','EXPIRED','e76033ffe4567510e8b1cf3a8707f2e0bda399527c3fe8eac6318e944c6afef6',NULL),(5,71,'2026-09-28 14:47:00.000000','2026-09-28 14:45:24.747180','EXPIRED','24a127c0cec53724b74b2488704859d06fc7df43d0e8e2eaa9292df82345970e',NULL),(6,71,'2026-09-28 14:47:00.000000','2026-09-28 14:45:24.791745','ACTIVE','c19b358cf0b7e4d4d5e1c0fc437db412d87a8ce9ab99fbccc6c0a285674270a1',NULL),(7,84,'2026-09-30 16:15:00.000000','2026-09-30 16:00:26.629344','EXPIRED','9f66b235741cc8723ebe8efad4b2dbc935c7fa634c7a52bf2483882b6a8d88bd',NULL),(8,84,'2026-09-30 16:15:00.000000','2026-09-30 16:00:26.683268','EXPIRED','15e9df687d3c4b4da68c2e9864177167b6b2bedb5741d9a557308d20e49e9647',NULL),(9,84,'2026-09-30 16:15:00.000000','2026-09-30 16:01:09.798180','EXPIRED','3ff5752ef8ef28db3fa24e1cc68e3082f26508d873c0e01296015a4970bc9419',NULL),(10,84,'2026-09-30 16:15:00.000000','2026-09-30 16:01:09.840629','ACTIVE','42b34359a12849559e8e6d5d1f90a1160840b8c89a946c86b9095ed27d17d707',NULL),(11,88,'2026-10-01 09:42:00.000000','2026-10-01 09:26:58.805055','EXPIRED','a140ba432f03fded441144412b10315d563997485e7b73e3f40159b7c305241d',NULL),(12,88,'2026-10-01 09:42:00.000000','2026-10-01 09:26:58.948914','ACTIVE','346a54f90118f0ceb29d59bfc0a365d4ae53990e43a4348b750cca8e18f1bef3',NULL);
/*!40000 ALTER TABLE `checkin_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_booking_summary`
--

DROP TABLE IF EXISTS `daily_booking_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_booking_summary` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calculated_at` datetime(6) NOT NULL,
  `cancelled_count` bigint NOT NULL,
  `checked_in_count` bigint NOT NULL,
  `completed_count` bigint NOT NULL,
  `confirmed_count` bigint NOT NULL,
  `expired_count` bigint NOT NULL,
  `no_show_count` bigint NOT NULL,
  `pending_approval_count` bigint NOT NULL,
  `rejected_count` bigint NOT NULL,
  `stat_date` date NOT NULL,
  `total_bookings` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_daily_summary_stat_date` (`stat_date`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_booking_summary`
--

LOCK TABLES `daily_booking_summary` WRITE;
/*!40000 ALTER TABLE `daily_booking_summary` DISABLE KEYS */;
INSERT INTO `daily_booking_summary` VALUES (1,'2026-09-24 16:34:40.296027',1,0,0,0,1,3,0,1,'2026-09-14',6),(2,'2026-09-24 16:34:40.341550',0,0,0,0,0,4,0,0,'2026-09-15',4),(3,'2026-09-24 16:34:40.366688',0,0,0,0,0,0,0,0,'2026-09-16',0),(4,'2026-09-24 16:34:40.383216',6,0,0,0,1,8,0,0,'2026-09-17',15),(5,'2026-09-24 16:34:40.400088',3,0,0,0,5,8,0,0,'2026-09-18',16),(6,'2026-09-24 16:34:40.423201',0,0,0,0,0,0,0,0,'2026-09-19',0),(7,'2026-09-24 16:34:40.439473',0,0,0,0,3,1,0,0,'2026-09-20',4),(8,'2026-09-24 16:34:40.464054',0,0,0,0,1,0,0,0,'2026-09-21',1),(9,'2026-09-24 16:34:40.480546',0,0,0,0,0,0,0,0,'2026-09-22',0),(10,'2026-09-24 16:34:40.497199',0,0,0,0,0,0,0,0,'2026-09-23',0),(11,'2026-09-25 07:22:59.445945',0,0,0,1,3,0,3,0,'2026-09-24',7),(12,'2026-09-25 23:45:00.016705',0,0,0,0,1,0,0,0,'2026-09-25',1),(13,'2026-09-28 00:05:00.037947',1,0,0,1,0,0,1,0,'2026-09-27',3),(14,'2026-09-29 00:13:37.690074',2,0,1,2,0,3,2,2,'2026-09-28',12),(15,'2026-09-30 00:04:49.850278',1,0,0,0,3,0,0,0,'2026-09-29',4),(16,'2026-10-01 04:57:31.056229',0,0,0,1,0,1,1,0,'2026-09-30',3),(17,'2026-10-01 09:30:00.025659',0,0,0,2,0,0,1,0,'2026-10-01',3);
/*!40000 ALTER TABLE `daily_booking_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `facilities`
--

DROP TABLE IF EXISTS `facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `facilities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_facilities_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `facilities`
--

LOCK TABLES `facilities` WRITE;
/*!40000 ALTER TABLE `facilities` DISABLE KEYS */;
INSERT INTO `facilities` VALUES (1,'Bảng trắng & Bút dạ','Bảng từ trắng treo tường cỡ lớn kèm bút viết dạ và bông lau',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(2,'Máy chiếu Full HD','Máy chiếu độ phân giải cao kết nối qua cổng HDMI/Type-C',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(3,'Màn hình TV thông minh 65 inch','Smart TV hỗ trợ trình chiếu không dây AirPlay/Miracast',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(4,'Ổ cắm điện đa năng','Hệ thống ổ cắm điện tích hợp cổng sạc USB/Type-C tại mỗi bàn/chỗ',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(5,'Điều hòa không khí 2 chiều','Hệ thống làm mát và thông gió độc lập',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(6,'Hệ thống âm thanh & Micro','Hệ thống loa âm trần và micro không dây phục vụ thuyết trình, hội thảo',NULL,'2026-09-25 13:22:17','2026-09-25 13:22:17'),(7,'Wifi băng thông cao 5GHz','Đường truyền Internet cáp quang tốc độ cao chuyên dụng',NULL,'2026-09-25 13:22:17','2026-09-25 13:22:17'),(8,'Đèn học chống cận thị','Đèn LED bảo vệ mắt với 3 chế độ ánh sáng tùy chỉnh',NULL,'2026-09-25 13:22:17','2026-09-25 13:22:17'),(9,'Máy lọc không khí & Khử khuẩn','Máy lọc khí công nghệ HEPA duy trì không gian học tập trong lành',NULL,'2026-09-25 13:22:17','2026-09-25 13:22:17'),(10,'Ghế công thái học Ergonomic','Ghế ngồi êm ái hỗ trợ cột sống cho buổi học tập kéo dài',NULL,'2026-09-25 13:22:17','2026-09-25 13:22:17');
/*!40000 ALTER TABLE `facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `maintenance_blocks`
--

DROP TABLE IF EXISTS `maintenance_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `maintenance_blocks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `space_id` bigint NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `deleted_at` datetime(6) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_maint_user` (`created_by`),
  KEY `idx_maint_time` (`space_id`,`start_time`,`end_time`),
  CONSTRAINT `fk_maint_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_maint_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `maintenance_blocks`
--

LOCK TABLES `maintenance_blocks` WRITE;
/*!40000 ALTER TABLE `maintenance_blocks` DISABLE KEYS */;
INSERT INTO `maintenance_blocks` VALUES (1,1,'2026-09-15 08:00:00','2026-09-15 11:00:00','Bảo trì định kỳ máy lạnh và sơn mới bảng viết',2,NULL,'2026-09-14 14:40:50','2026-09-20 12:53:35'),(2,1,'2026-09-24 21:00:00','2026-09-24 22:00:00','Bảo dưỡng định kỳ hệ thống điều hòa & quạt thông gió',2,NULL,'2026-09-24 20:26:39','2026-09-24 20:26:39'),(3,1,'2026-09-30 12:30:00','2026-09-30 13:30:00','Nâng cấp bảng tương tác thông minh và hệ thống đèn LED',2,NULL,'2026-09-24 20:26:39','2026-09-30 10:40:18'),(4,2,'2026-09-25 13:00:00','2026-09-25 15:00:00','Kiểm tra và nâng cấp firmware Màn hình TV 65 inch',2,NULL,'2026-09-24 20:26:39','2026-09-24 20:26:39'),(5,7,'2026-09-27 14:00:00','2026-09-27 17:00:00','Sắp xếp lại cụm bàn thảo luận và bổ sung ổ cắm sàn',2,NULL,'2026-09-24 20:26:39','2026-09-24 20:26:39');
/*!40000 ALTER TABLE `maintenance_blocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `space_id` bigint NOT NULL,
  `seat_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_seats_space_seat_code` (`space_id`,`seat_code`),
  KEY `idx_seats_space_status` (`space_id`,`status`),
  KEY `idx_seats_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_seats_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_seats_status` CHECK ((`status` in (_utf8mb4'AVAILABLE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (1,4,'S01','AVAILABLE','Ghế cá nhân 01 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(2,4,'S02','AVAILABLE','Ghế cá nhân 02 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(3,4,'S03','AVAILABLE','Ghế cá nhân 03 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(4,4,'S04','AVAILABLE','Ghế cá nhân 04 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(5,4,'S05','AVAILABLE','Ghế cá nhân 05 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(6,4,'S06','AVAILABLE','Ghế cá nhân 06 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(7,4,'S07','AVAILABLE','Ghế cá nhân 07 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(8,4,'S08','AVAILABLE','Ghế cá nhân 08 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(9,4,'S09','AVAILABLE','Ghế cá nhân 09 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(10,4,'S10','INACTIVE','Ghế cá nhân 10 tại Khu tự học S-201',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11'),(11,24,'S01','AVAILABLE','Ghế cá nhân 01 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(12,24,'S02','AVAILABLE','Ghế cá nhân 02 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(13,24,'S03','AVAILABLE','Ghế cá nhân 03 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(14,24,'S04','AVAILABLE','Ghế cá nhân 04 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(15,24,'S05','AVAILABLE','Ghế cá nhân 05 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(16,24,'S06','AVAILABLE','Ghế cá nhân 06 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(17,24,'S07','AVAILABLE','Ghế cá nhân 07 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(18,24,'S08','AVAILABLE','Ghế cá nhân 08 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(19,24,'S09','AVAILABLE','Ghế cá nhân 09 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(20,24,'S10','AVAILABLE','Ghế cá nhân 10 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(21,24,'S11','AVAILABLE','Ghế cá nhân 11 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(22,24,'S12','AVAILABLE','Ghế cá nhân 12 tại Khu tự học S-202',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(23,25,'S01','AVAILABLE','Ghế cá nhân 01 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(24,25,'S02','AVAILABLE','Ghế cá nhân 02 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(25,25,'S03','AVAILABLE','Ghế cá nhân 03 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(26,25,'S04','AVAILABLE','Ghế cá nhân 04 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(27,25,'S05','AVAILABLE','Ghế cá nhân 05 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(28,25,'S06','AVAILABLE','Ghế cá nhân 06 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(29,25,'S07','AVAILABLE','Ghế cá nhân 07 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(30,25,'S08','AVAILABLE','Ghế cá nhân 08 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(31,25,'S09','AVAILABLE','Ghế cá nhân 09 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(32,25,'S10','AVAILABLE','Ghế cá nhân 10 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(33,25,'S11','AVAILABLE','Ghế cá nhân 11 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(34,25,'S12','AVAILABLE','Ghế cá nhân 12 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(35,25,'S13','AVAILABLE','Ghế cá nhân 13 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(36,25,'S14','AVAILABLE','Ghế cá nhân 14 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(37,25,'S15','AVAILABLE','Ghế cá nhân 15 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(38,25,'S16','AVAILABLE','Ghế cá nhân 16 tại Khu tự học S-301',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(42,39,'S01','INACTIVE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 16:13:21'),(43,39,'S02','AVAILABLE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 13:59:51'),(44,39,'S03','AVAILABLE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 13:59:51'),(45,39,'S04','AVAILABLE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 13:59:51'),(46,39,'S05','AVAILABLE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 13:59:51'),(47,39,'S06','AVAILABLE',NULL,NULL,'2026-09-30 13:59:51','2026-09-30 13:59:51'),(48,39,'S07','INACTIVE',NULL,'2026-09-30 14:00:57','2026-09-30 13:59:51','2026-09-30 14:00:57'),(49,39,'S08','INACTIVE',NULL,'2026-09-30 14:00:59','2026-09-30 13:59:51','2026-09-30 14:00:59'),(50,39,'S09','INACTIVE',NULL,'2026-09-30 14:01:01','2026-09-30 13:59:51','2026-09-30 14:01:01'),(51,39,'S10','INACTIVE',NULL,'2026-09-30 14:01:03','2026-09-30 13:59:51','2026-09-30 14:01:03'),(52,39,'S11','INACTIVE',NULL,'2026-09-30 14:01:05','2026-09-30 13:59:51','2026-09-30 14:01:05'),(53,39,'S12','INACTIVE',NULL,'2026-09-30 14:01:07','2026-09-30 13:59:51','2026-09-30 14:01:07'),(54,39,'S13','INACTIVE',NULL,'2026-09-30 14:00:45','2026-09-30 13:59:51','2026-09-30 14:00:45'),(55,39,'S14','INACTIVE',NULL,'2026-09-30 14:00:49','2026-09-30 13:59:51','2026-09-30 14:00:49'),(56,39,'S15','INACTIVE',NULL,'2026-09-30 14:00:47','2026-09-30 13:59:51','2026-09-30 14:00:47'),(57,39,'S16','INACTIVE',NULL,'2026-09-30 14:00:52','2026-09-30 13:59:51','2026-09-30 14:00:52'),(58,39,'S17','INACTIVE',NULL,'2026-09-30 14:00:53','2026-09-30 13:59:51','2026-09-30 14:00:53'),(59,39,'S18','INACTIVE',NULL,'2026-09-30 14:00:55','2026-09-30 13:59:51','2026-09-30 14:00:55'),(60,39,'S19','INACTIVE',NULL,'2026-09-30 14:00:43','2026-09-30 13:59:51','2026-09-30 14:00:43'),(61,39,'S20','INACTIVE',NULL,'2026-09-30 14:00:40','2026-09-30 13:59:51','2026-09-30 14:00:40'),(62,39,'S27','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(63,39,'S28','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(64,39,'S29','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(65,39,'S30','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(66,39,'S31','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(67,39,'S32','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(68,39,'S33','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(69,39,'S34','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(70,39,'S35','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(71,39,'S36','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(72,39,'S37','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(73,39,'S38','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(74,39,'S39','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(75,39,'S40','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(76,39,'S41','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(77,39,'S42','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(78,39,'S43','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(79,39,'S44','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(80,39,'S45','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(81,39,'S46','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(82,39,'S47','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(83,39,'S48','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(84,39,'S49','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(85,39,'S50','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(86,39,'S51','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(87,39,'S52','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(88,39,'S53','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(89,39,'S54','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(90,39,'S55','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(91,39,'S56','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(92,39,'S57','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(93,39,'S58','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(94,39,'S59','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(95,39,'S60','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(96,39,'S61','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(97,39,'S62','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(98,39,'S63','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(99,39,'S64','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(100,39,'S65','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(101,39,'S66','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(102,39,'S67','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(103,39,'S68','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(104,39,'S69','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(105,39,'S70','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(106,39,'S71','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(107,39,'S72','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(108,39,'S73','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(109,39,'S74','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(110,39,'S75','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(111,39,'S76','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(112,39,'S77','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(113,39,'S78','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(114,39,'S79','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(115,39,'S80','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(116,39,'S81','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(117,39,'S82','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(118,39,'S83','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(119,39,'S84','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(120,39,'S85','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(121,39,'S86','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(122,39,'S87','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(123,39,'S88','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(124,39,'S89','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(125,39,'S90','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(126,39,'S91','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(127,39,'S92','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(128,39,'S93','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(129,39,'S94','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(130,39,'S95','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(131,39,'S96','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(132,39,'S97','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(133,39,'S98','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(134,39,'S99','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(135,39,'S100','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(136,39,'S101','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(137,39,'S102','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(138,39,'S103','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(139,39,'S104','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(140,39,'S105','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(141,39,'S106','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(142,39,'S107','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(143,39,'S108','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(144,39,'S109','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(145,39,'S110','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(146,39,'S111','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(147,39,'S112','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(148,39,'S113','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(149,39,'S114','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(150,39,'S115','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(151,39,'S116','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(152,39,'S117','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(153,39,'S118','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(154,39,'S119','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35'),(155,39,'S120','AVAILABLE',NULL,NULL,'2026-09-30 15:47:35','2026-09-30 15:47:35');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `space_facilities`
--

DROP TABLE IF EXISTS `space_facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `space_facilities` (
  `space_id` bigint NOT NULL,
  `facility_id` bigint NOT NULL,
  PRIMARY KEY (`space_id`,`facility_id`),
  KEY `fk_sf_facility` (`facility_id`),
  CONSTRAINT `fk_sf_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sf_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `space_facilities`
--

LOCK TABLES `space_facilities` WRITE;
/*!40000 ALTER TABLE `space_facilities` DISABLE KEYS */;
INSERT INTO `space_facilities` VALUES (1,1),(2,1),(3,1),(7,1),(15,1),(16,1),(17,1),(18,1),(19,1),(20,1),(21,1),(22,1),(23,1),(39,1),(40,1),(3,2),(22,2),(23,2),(39,2),(2,3),(3,3),(15,3),(16,3),(17,3),(18,3),(19,3),(20,3),(21,3),(22,3),(23,3),(1,4),(2,4),(3,4),(4,4),(5,4),(7,4),(8,4),(9,4),(10,4),(11,4),(12,4),(13,4),(14,4),(15,4),(16,4),(17,4),(18,4),(19,4),(20,4),(21,4),(22,4),(23,4),(24,4),(25,4),(1,5),(2,5),(3,5),(4,5),(5,5),(7,5),(8,5),(9,5),(10,5),(11,5),(12,5),(13,5),(14,5),(15,5),(16,5),(17,5),(18,5),(19,5),(20,5),(21,5),(22,5),(23,5),(24,5),(25,5),(22,6),(23,6),(8,7),(9,7),(10,7),(11,7),(12,7),(13,7),(14,7),(15,7),(16,7),(17,7),(18,7),(19,7),(20,7),(21,7),(22,7),(23,7),(24,7),(25,7),(8,8),(9,8),(10,8),(11,8),(12,8),(13,8),(14,8),(24,8),(25,8),(8,9),(9,9),(10,9),(11,9),(12,9),(13,9),(14,9),(8,10),(9,10),(10,10),(11,10),(12,10),(13,10),(14,10),(24,10),(25,10);
/*!40000 ALTER TABLE `space_facilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `space_images`
--

DROP TABLE IF EXISTS `space_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `space_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `space_id` bigint NOT NULL,
  `image_url` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_space_images_space_id` (`space_id`),
  KEY `idx_space_images_primary` (`space_id`,`is_primary`),
  CONSTRAINT `fk_space_images_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `space_images`
--

LOCK TABLES `space_images` WRITE;
/*!40000 ALTER TABLE `space_images` DISABLE KEYS */;
INSERT INTO `space_images` VALUES (1,1,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(2,2,'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(3,3,'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(4,4,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(5,5,'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(6,6,'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(7,7,'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',1,1,'2026-09-20 11:56:59','2026-09-20 11:56:59'),(8,1,'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(9,1,'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(10,1,'https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(11,2,'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(12,2,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(13,2,'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(14,3,'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(15,3,'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(16,3,'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(17,4,'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(18,4,'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(19,4,'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(20,5,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(21,5,'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(22,5,'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(23,6,'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(24,6,'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(25,7,'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',0,2,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(26,7,'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&auto=format&fit=crop&q=80',0,3,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(27,7,'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&auto=format&fit=crop&q=80',0,4,'2026-09-24 14:19:59','2026-09-24 14:19:59'),(28,17,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(29,18,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(30,19,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(31,20,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(32,21,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(33,22,'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(34,23,'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(35,24,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(36,25,'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(37,8,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(38,9,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(39,10,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(40,11,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(41,12,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(42,13,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(43,14,'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(44,15,'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(45,16,'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&auto=format&fit=crop&q=80',1,1,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(59,39,'/uploads/spaces/41ff322f-bebf-472f-b05b-2940d776a16a.png',1,0,'2026-09-30 13:59:02','2026-09-30 13:59:02'),(60,39,'/uploads/spaces/3d57b8c2-6a2b-46d0-b3f3-33609a226ebe.png',0,1,'2026-09-30 13:59:02','2026-09-30 13:59:02'),(61,39,'/uploads/spaces/05a2e497-41fc-45fd-8722-5b85009ca32f.png',0,2,'2026-09-30 13:59:02','2026-09-30 13:59:02'),(62,40,'/uploads/spaces/b8166274-b129-4c2e-bb94-a3e49b4e6935.png',1,0,'2026-09-30 15:57:04','2026-09-30 15:57:04'),(63,40,'/uploads/spaces/8e8edbfb-3fcc-40ff-a4d4-6100487de99c.png',0,1,'2026-09-30 15:57:04','2026-09-30 15:57:04'),(64,40,'/uploads/spaces/118eda8c-e835-46ba-883f-20ca97807b55.png',0,2,'2026-09-30 15:57:04','2026-09-30 15:57:04'),(65,40,'/uploads/spaces/dce17d73-9b6a-4ad2-b5f4-4128a43cc1a3.png',0,3,'2026-09-30 15:57:04','2026-09-30 15:57:04');
/*!40000 ALTER TABLE `space_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `space_tables`
--

DROP TABLE IF EXISTS `space_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `space_tables` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `space_id` bigint NOT NULL,
  `table_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_space_table_code` (`space_id`,`table_code`),
  KEY `idx_space_tables_space_status` (`space_id`,`status`),
  KEY `idx_space_tables_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_space_tables_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_space_tables_capacity` CHECK ((`capacity` > 0)),
  CONSTRAINT `chk_space_tables_status` CHECK ((`status` in (_utf8mb4'AVAILABLE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `space_tables`
--

LOCK TABLES `space_tables` WRITE;
/*!40000 ALTER TABLE `space_tables` DISABLE KEYS */;
INSERT INTO `space_tables` VALUES (1,7,'T01',6,'AVAILABLE','Bàn 6 chỗ gần cửa sổ dãy A',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(2,7,'T02',6,'AVAILABLE','Bàn 6 chỗ gần màn hình trình chiếu',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(3,7,'T03',4,'AVAILABLE','Bàn 4 chỗ góc yên tĩnh',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(4,7,'T04',8,'AVAILABLE','Bàn lớn 8 chỗ trung tâm phòng',NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(5,15,'T04',8,'AVAILABLE','Bàn nhóm 8 chỗ trung tâm phòng',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(6,15,'T03',6,'AVAILABLE','Bàn nhóm 6 chỗ gần cửa sổ',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(7,15,'T02',6,'AVAILABLE','Bàn nhóm 6 chỗ gần màn hình',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(8,15,'T01',4,'AVAILABLE','Bàn nhóm 4 chỗ gần bảng trắng',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(9,16,'T04',6,'AVAILABLE','Bàn nhóm 6 chỗ gần màn hình',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(10,16,'T03',6,'AVAILABLE','Bàn nhóm 6 chỗ gần bảng',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(11,16,'T02',4,'AVAILABLE','Bàn nhóm 4 chỗ gần cửa sổ',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(12,16,'T01',4,'AVAILABLE','Bàn nhóm 4 chỗ yên tĩnh',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11'),(20,40,'t02',4,'AVAILABLE',NULL,NULL,'2026-09-30 15:57:28','2026-09-30 15:57:28'),(21,40,'t4',9,'AVAILABLE',NULL,NULL,'2026-09-30 15:57:42','2026-09-30 15:57:42');
/*!40000 ALTER TABLE `space_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `space_types`
--

DROP TABLE IF EXISTS `space_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `space_types` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `booking_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'WHOLE_SPACE',
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_space_types_name` (`name`),
  CONSTRAINT `chk_space_types_booking_mode` CHECK ((`booking_mode` in (_utf8mb4'WHOLE_SPACE',_utf8mb4'PER_SEAT',_utf8mb4'PER_TABLE')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `space_types`
--

LOCK TABLES `space_types` WRITE;
/*!40000 ALTER TABLE `space_types` DISABLE KEYS */;
INSERT INTO `space_types` VALUES (1,'Phòng học nhóm tiêu chuẩn','Phòng dành cho 4 - 8 sinh viên tự học, thảo luận nhóm; đặt nguyên phòng','WHOLE_SPACE',1,NULL,'2026-09-16 14:35:54','2026-09-18 21:04:33'),(2,'Phòng thuyết trình & Hội thảo','Phòng trang bị máy chiếu, âm thanh; đặt nguyên phòng, bắt buộc Staff duyệt','WHOLE_SPACE',1,NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(3,'Khu tự học chung (Mở)','Không gian tự học tập trung nhiều chỗ ngồi; sinh viên đặt theo từng chỗ ngồi (seat)','PER_SEAT',0,NULL,'2026-09-16 14:35:54','2026-09-16 14:35:54'),(4,'Study Booth cá nhân','Khoang tự học cách âm độc lập dành cho 1 - 2 sinh viên; đặt nguyên booth','WHOLE_SPACE',1,NULL,'2026-09-16 14:35:54','2026-09-18 21:04:33'),(5,'Phòng thảo luận theo bàn','Phòng trang bị bàn nhóm độc lập; sinh viên đặt theo từng bàn (table)','PER_TABLE',1,NULL,'2026-09-16 14:35:54','2026-09-18 21:04:33');
/*!40000 ALTER TABLE `space_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `spaces`
--

DROP TABLE IF EXISTS `spaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `spaces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `space_type_id` bigint NOT NULL,
  `building` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `floor` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `description` text COLLATE utf8mb4_unicode_ci,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `space_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_spaces_space_type` (`space_type_id`),
  KEY `idx_spaces_search` (`status`,`space_type_id`,`capacity`),
  KEY `idx_spaces_building` (`building`,`floor`),
  KEY `idx_spaces_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_spaces_space_type` FOREIGN KEY (`space_type_id`) REFERENCES `space_types` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `chk_spaces_capacity` CHECK ((`capacity` > 0)),
  CONSTRAINT `chk_spaces_status` CHECK ((`status` in (_utf8mb4'AVAILABLE',_utf8mb4'MAINTENANCE',_utf8mb4'INACTIVE')))
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `spaces`
--

LOCK TABLES `spaces` WRITE;
/*!40000 ALTER TABLE `spaces` DISABLE KEYS */;
INSERT INTO `spaces` VALUES (1,'Phòng G-101',1,'Tòa A','1',6,'AVAILABLE','Phòng học nhóm tầng 1, gần sảnh chờ (WHOLE_SPACE)',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','G-101'),(2,'Phòng G-102',1,'Tòa A','1',8,'AVAILABLE','Phòng học nhóm cỡ vừa, trang bị bảng và màn hình lớn (WHOLE_SPACE)',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','G-102'),(3,'Phòng P-201',2,'Tòa A','2',1,'AVAILABLE','Phòng thuyết trình chuyên dụng, cách âm (WHOLE_SPACE)',NULL,'2026-09-16 14:35:54','2026-09-29 11:40:07','P-201'),(4,'Khu tự học S-201',3,'Tòa B','2',10,'AVAILABLE','Khu tự học chung tầng 2, sức chứa 10 chỗ ngồi độc lập (PER_SEAT)',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','S-201'),(5,'Study Booth B-01',4,'Tòa B','3',1,'AVAILABLE','Khoang tự học yên tĩnh, bàn đôi (WHOLE_SPACE)',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','B-01'),(6,'Phòng G-103 (Bảo trì)',1,'Tòa A','1',6,'MAINTENANCE','Phòng đang cải tạo hệ thống điện, tạm ngừng phục vụ',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','G-103'),(7,'Phòng D-201',5,'Tòa D','2',24,'AVAILABLE','Phòng thảo luận nhóm tầng 2, sức chứa 24 chỗ chia thành 4 bàn (PER_TABLE)',NULL,'2026-09-16 14:35:54','2026-09-29 10:25:11','D-201'),(8,'Study Booth B-02',4,'Tòa B','3',1,'AVAILABLE','Khoang học tập riêng tư dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-02'),(9,'Study Booth B-03',4,'Tòa B','3',1,'AVAILABLE','Khoang học tập riêng tư dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-03'),(10,'Study Booth B-04',4,'Tòa B','3',1,'AVAILABLE','Khoang học tập riêng tư dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-04'),(11,'Study Booth B-05',4,'Tòa C','2',1,'AVAILABLE','Khoang học tập cách âm dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-05'),(12,'Study Booth B-06',4,'Tòa C','2',1,'AVAILABLE','Khoang học tập cách âm dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-06'),(13,'Study Booth B-07',4,'Tòa D','2',2,'AVAILABLE','Khoang học tập cá nhân dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 11:41:28','B-07'),(14,'Study Booth B-08',4,'Tòa D','2',1,'AVAILABLE','Khoang học tập cá nhân dành cho đúng 1 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','B-08'),(15,'Phòng D-202',5,'Tòa D','2',24,'AVAILABLE','Phòng thảo luận gồm 4 bàn nhóm với sức chứa khác nhau.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','D-202'),(16,'Phòng D-301',5,'Tòa D','3',20,'AVAILABLE','Phòng thảo luận linh hoạt gồm 4 bàn nhóm.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','D-301'),(17,'Phòng G-201',1,'Tòa A','2',4,'AVAILABLE','Phòng học nhóm nhỏ dành cho 2 đến 4 sinh viên.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','G-201'),(18,'Phòng G-202',1,'Tòa A','2',6,'AVAILABLE','Phòng học nhóm tiêu chuẩn dành cho tối đa 6 sinh viên.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','G-202'),(19,'Phòng G-301',1,'Tòa C','3',8,'AVAILABLE','Phòng học nhóm có màn hình trình chiếu, tối đa 8 sinh viên.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','G-301'),(20,'Phòng G-302',1,'Tòa C','3',10,'AVAILABLE','Phòng học nhóm lớn dành cho tối đa 10 sinh viên.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','G-302'),(21,'Phòng G-401',1,'Tòa D','4',12,'AVAILABLE','Phòng học nhóm và sinh hoạt câu lạc bộ, tối đa 12 sinh viên.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','G-401'),(22,'Phòng P-301',2,'Tòa A','3',30,'AVAILABLE','Phòng thuyết trình có máy chiếu và hệ thống âm thanh.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','P-301'),(23,'Phòng P-401',2,'Tòa C','4',50,'AVAILABLE','Phòng hội thảo lớn dành cho tối đa 50 người.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','P-401'),(24,'Khu tự học S-202',3,'Tòa B','2',12,'AVAILABLE','Khu tự học mở gồm 12 ghế cá nhân đặt riêng từng chỗ.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','S-202'),(25,'Khu tự học S-301',3,'Tòa C','3',16,'AVAILABLE','Khu tự học yên tĩnh gồm 16 ghế cá nhân đặt riêng từng chỗ.',NULL,'2026-09-29 10:25:11','2026-09-29 10:25:11','S-301'),(39,'phòng học',3,'Tòa A','1',100,'AVAILABLE',NULL,NULL,'2026-09-30 13:59:01','2026-09-30 15:47:45','VANNIE'),(40,'ẻe',5,'tòa A','1',30,'AVAILABLE',NULL,NULL,'2026-09-30 15:57:03','2026-09-30 15:57:53','TT');
/*!40000 ALTER TABLE `spaces` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_audit_logs`
--

DROP TABLE IF EXISTS `staff_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint NOT NULL,
  `actor_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_id` bigint NOT NULL,
  `space_id` bigint DEFAULT NULL,
  `details` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_staff_audit_action` (`action`),
  KEY `idx_staff_audit_target` (`target_type`,`target_id`),
  KEY `idx_staff_audit_space` (`space_id`),
  KEY `idx_staff_audit_actor` (`actor_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_audit_logs`
--

LOCK TABLES `staff_audit_logs` WRITE;
/*!40000 ALTER TABLE `staff_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_schedules`
--

DROP TABLE IF EXISTS `student_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `course_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `schedule_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sched_student_date` (`student_id`,`schedule_date`),
  CONSTRAINT `fk_sched_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_schedules`
--

LOCK TABLES `student_schedules` WRITE;
/*!40000 ALTER TABLE `student_schedules` DISABLE KEYS */;
INSERT INTO `student_schedules` VALUES (1,3,'Phát triển phần mềm dịch vụ','2026-09-30','08:00:00','11:30:00','Phòng B2.04'),(2,3,'Kiểm thử phần mềm nâng cao','2026-09-15','13:00:00','16:30:00','Phòng C1.02'),(3,4,'Kiến trúc hướng dịch vụ (SOA)','2026-09-14','09:00:00','11:45:00','Phòng A3.01'),(4,4,'Phân tích thiết kế hệ thống','2026-09-29','07:30:00','11:00:00','Phòng B1.08'),(68,5,'[KV-DEMO] Cơ sở dữ liệu nâng cao','2026-09-30','13:00:00','16:00:00','C2-01'),(69,5,'[KV-DEMO] Lập trình Web hiện đại','2026-10-02','07:30:00','10:30:00','Lab-02'),(70,5,'[KV-DEMO] Điện toán đám mây','2026-10-05','13:00:00','16:00:00','B3-05'),(71,5,'[KV-DEMO] An toàn thông tin','2026-10-07','08:00:00','11:00:00','A2-03'),(72,4,'[KV-DEMO] Phát triển phần mềm hướng dịch vụ','2026-09-30','07:30:00','10:30:00','B2-04'),(73,4,'[KV-DEMO] Quản lý dự án phần mềm','2026-10-01','13:00:00','16:00:00','C1-02'),(74,4,'[KV-DEMO] Kiến trúc phần mềm','2026-10-05','08:00:00','11:00:00','A3-01'),(75,4,'[KV-DEMO] Kiểm thử phần mềm nâng cao','2026-10-06','13:30:00','16:30:00','Lab-03'),(76,6,'[KV-DEMO] Cấu trúc dữ liệu và giải thuật','2026-10-01','07:30:00','10:30:00','A1-05'),(77,6,'[KV-DEMO] Lập trình ứng dụng di động','2026-10-02','13:00:00','16:00:00','Lab-01'),(78,6,'[KV-DEMO] Trí tuệ nhân tạo','2026-10-06','08:00:00','11:00:00','B1-06'),(79,6,'[KV-DEMO] Thiết kế giao diện người dùng','2026-10-08','13:30:00','16:30:00','D2-02'),(80,7,'[KV-DEMO] Phân tích thiết kế hệ thống','2026-09-30','08:00:00','11:00:00','B1-08'),(81,7,'[KV-DEMO] Công nghệ phần mềm','2026-10-02','13:30:00','16:30:00','C3-04'),(82,7,'[KV-DEMO] Lập trình Java','2026-10-07','07:30:00','10:30:00','Lab-04'),(83,7,'[KV-DEMO] Kỹ năng làm việc nhóm','2026-10-09','13:00:00','15:00:00','A4-01'),(84,10,'[KV-DEMO] Nhập môn học máy','2026-10-01','13:00:00','16:00:00','B3-01'),(85,10,'[KV-DEMO] Xử lý ngôn ngữ tự nhiên','2026-10-03','08:00:00','11:00:00','Lab-07'),(86,10,'[KV-DEMO] Khai phá dữ liệu','2026-10-07','13:30:00','16:30:00','C4-03'),(87,10,'[KV-DEMO] Thị giác máy tính','2026-10-09','08:00:00','11:00:00','Lab-08'),(88,11,'[KV-DEMO] Đảm bảo chất lượng phần mềm','2026-09-30','07:30:00','10:30:00','D2-04'),(89,11,'[KV-DEMO] Tự động hóa kiểm thử','2026-10-02','13:00:00','16:00:00','Lab-09'),(90,11,'[KV-DEMO] Quản lý cấu hình phần mềm','2026-10-06','08:00:00','11:00:00','C3-06'),(91,11,'[KV-DEMO] Đồ án chuyên ngành','2026-10-08','13:30:00','16:30:00','A5-01'),(92,9,'[KV-DEMO] Hệ quản trị cơ sở dữ liệu','2026-09-30','13:00:00','16:00:00','Lab-06'),(93,9,'[KV-DEMO] Phân tích dữ liệu','2026-10-02','08:00:00','11:00:00','C2-05'),(94,9,'[KV-DEMO] Kho dữ liệu và BI','2026-10-05','13:30:00','16:30:00','B4-02'),(95,9,'[KV-DEMO] Hệ thống thông tin doanh nghiệp','2026-10-09','07:30:00','10:30:00','A2-06'),(96,8,'[KV-DEMO] Mạng máy tính','2026-10-01','08:00:00','11:00:00','C1-05'),(97,8,'[KV-DEMO] Hệ điều hành','2026-10-03','13:00:00','16:00:00','B2-06'),(98,8,'[KV-DEMO] DevOps và CI/CD','2026-10-06','13:30:00','16:30:00','Lab-05'),(99,8,'[KV-DEMO] Phát triển phần mềm Agile','2026-10-08','07:30:00','10:30:00','D1-03');
/*!40000 ALTER TABLE `student_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('ADMIN','STAFF','STUDENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dob` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `UKr43af9ap4edm43mmtq01oddj6` (`username`),
  UNIQUE KEY `UKqh3otyipv2k9hqte4a1abcyhq` (`student_id`),
  UNIQUE KEY `uq_users_user_code` (`user_code`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Nguyễn Ngọc Anh (Admin)','0988000111','ADMIN',1,'2026-09-14 14:40:50','admin','Phòng Quản trị hệ thống','10/01/1990',NULL,'AD001',NULL),(2,'staff@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Nguyễn Thị Kim Tuyến (Staff)','0988000222','STAFF',1,'2026-09-14 14:40:50','staff','Phòng Quản lý cơ sở vật chất','15/05/1995',NULL,'NV001',NULL),(3,'student@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Lê Minh Tân (Sinh viên)','0988000333','STUDENT',1,'2026-09-14 14:40:50','SV001','Khoa Công nghệ thông tin','05/02/2004',NULL,'SV001','CNTT1'),(4,'khanhvan@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Nguyễn Khánh Vân','0988000444','STUDENT',1,'2026-09-14 14:40:50','SV002','Khoa Công nghệ thông tin','12/08/2005',NULL,'SV002','CNTT2'),(5,'anhvu@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Trần Anh Vũ','0988000555','STUDENT',1,'2026-09-14 14:40:50','SV003','Khoa Kỹ thuật phần mềm','21/04/2005',NULL,'SV003','KTPM1'),(6,'student2@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Nguyễn Hoàng Nam','0988000666','STUDENT',1,'2026-09-15 10:05:38','SV004','Khoa Công nghệ thông tin','03/01/2005',NULL,'SV004','CNTT1'),(7,'sv.anh@eduspace.vn','$2a$10$jDWinKofKccszti4oiU97e7dDKTeEmjKf8KZm/kUzZv9NZ2Ck0fDO','Nguyễn Minh Anh','0987654321','STUDENT',1,'2026-09-28 11:57:01','sv.anh','Khoa Công nghệ thông tin','15/03/2005',NULL,'SV005','CNTT2'),(8,'sv.nam@eduspace.vn','$2a$10$jDWinKofKccszti4oiU97e7dDKTeEmjKf8KZm/kUzZv9NZ2Ck0fDO','Trần Hoàng Nam','0987654322','STUDENT',1,'2026-09-28 11:57:01','sv.nam','Khoa Kỹ thuật phần mềm','22/07/2005',NULL,'SV006','KTPM1'),(9,'sv.ha@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Lê Thu Hà','0987654323','STUDENT',1,'2026-09-29 10:35:34','sv.ha','Khoa Hệ thống thông tin','09/11/2005',NULL,'SV007','HTTT1'),(10,'sv.bao@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Phạm Gia Bảo','0987654324','STUDENT',1,'2026-09-29 10:35:34','sv.bao','Khoa Công nghệ thông tin','18/02/2005',NULL,'SV008','CNTT3'),(11,'sv.chi@eduspace.vn','$2a$10$5dyabDP1SMz7H.XWk40E2OZtiELmCry9FrmymUcb7uqGBi9vy7/DS','Ngô Quỳnh Chi','0987654325','STUDENT',1,'2026-09-29 10:35:34','sv.chi','Khoa Kỹ thuật phần mềm','30/06/2005',NULL,'SV009','KTPM2');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'eduspace'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-01  9:41:14
