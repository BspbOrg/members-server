SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

--
-- Table structure for table `members`
--

CREATE TABLE `members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `surname` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `family` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `egn` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `username` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `password` varchar(32) COLLATE utf8_unicode_ci DEFAULT NULL,
  `city` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `postcode` varchar(10) COLLATE utf8_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `street` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `number` int(5) DEFAULT NULL,
  `block` int(5) DEFAULT NULL,
  `doorway` varchar(1) COLLATE utf8_unicode_ci DEFAULT NULL,
  `floor` int(5) DEFAULT NULL,
  `apartment` int(5) DEFAULT NULL,
  `home_phone` int(20) DEFAULT NULL,
  `work_phone` int(20) DEFAULT NULL,
  `mobile` int(20) DEFAULT NULL,
  `email` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `date_created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `type` int(11) NOT NULL DEFAULT '1',
  `lost_code` varchar(50) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lost_date` datetime DEFAULT NULL,
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL,
  `card` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `card_expiry` date DEFAULT NULL,
  `family_members` int(11) DEFAULT '0',
  `country` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `members`
--

INSERT INTO `members` (`id`, `name`, `surname`, `family`, `egn`, `username`, `password`, `city`, `postcode`, `neighborhood`, `street`, `number`, `block`, `doorway`, `floor`, `apartment`, `home_phone`, `work_phone`, `mobile`, `email`, `website`, `date_created`, `type`, `lost_code`, `lost_date`, `parent_id`, `card`, `card_expiry`, `family_members`, `country`) VALUES
(1, 'Тестов', 'Потребител', NULL, NULL, 'user1', NULL, NULL, NULL, '', NULL, NULL, 0, '', 0, 0, 0, 0, 0, NULL, '', '2018-09-17 00:00:00', 1, NULL, NULL, NULL, '123456', NULL, 1, NULL),
(2, 'Тестер', '', 'Тестер', NULL, 'user2', NULL, NULL, NULL, '', NULL, NULL, 0, '', 0, 0, 0, 0, 0, NULL, '', '2018-09-17 00:00:00', 1, NULL, NULL, NULL, '', NULL, 1, NULL),
(3, 'Testing', '', 'User', NULL, 'user3', NULL, NULL, NULL, '', NULL, NULL, 0, '', 0, 0, 0, 0, 0, NULL, '', '2018-09-17 00:00:00', 1, NULL, NULL, NULL, '', NULL, 1, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `type` (`type`),
  ADD KEY `parent_id` (`parent_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `members`
--
ALTER TABLE `members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `members` (`id`) ON DELETE CASCADE;
COMMIT;


-- --------------------------------------------------------


--
-- Table structure for table `members_history`
--

CREATE TABLE `members_history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `member_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nomenclature_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` enum('member','donate') COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(200) COLLATE utf8_unicode_ci DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `payment_type` enum('office','epay','bank') COLLATE utf8_unicode_ci DEFAULT NULL,
  `city_office` varchar(100) COLLATE utf8_unicode_ci DEFAULT NULL,
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_date` date DEFAULT NULL,
  `paid` tinyint(1) NOT NULL DEFAULT '0',
  `donation_type` text COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `members_history`
--

INSERT INTO `members_history` (`id`, `member_id`, `nomenclature_id`, `type`, `name`, `amount`, `payment_type`, `city_office`, `payment_date`, `paid_date`, `paid`, `donation_type`) VALUES
(1286, 1, 0, 'member', NULL, NULL, '', '', '2018-09-17 00:01:02', NULL, 0, NULL),
(1309, 2, 0, 'member', NULL, NULL, '', '', '2018-09-17 00:01:02', NULL, 0, NULL),
(1385, 3, 0, 'donate', NULL, NULL, '', '', '2018-09-17 00:01:02', NULL, 0, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `members_history`
--
ALTER TABLE `members_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `member_id` (`member_id`),
  ADD KEY `paid` (`paid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `members_history`
--
ALTER TABLE `members_history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10000;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `members_history`
--
ALTER TABLE `members_history`
  ADD CONSTRAINT `members_history_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE;
COMMIT;


-- --------------------------------------------------------


--
-- Table structure for table `payment_log`
--

CREATE TABLE `payment_log` (
  `id` int(11) NOT NULL,
  `order_id` varchar(20) COLLATE utf8_unicode_ci DEFAULT NULL,
  `raw_data` blob,
  `log_date` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Dumping data for table `payment_log`
--

INSERT INTO `payment_log` (`id`, `order_id`, `raw_data`, `log_date`) VALUES
(1, 'DON_1          ', 0x313032303135303332373134343330313030303030303030313230303135353130343936444f4e5f31202020202020202020203931312e3048d7c51fbb4b896bf1099760ca2632bbf8c4c3e9ba6fcabd2a13c6c93ab371bec6ea7834140a7cc1d8ee563f101bf2187a7d5b306a22522463ab1378810cad580e6f5c63c764f1a9c530d8347220ed1599720ec480c34e588e3a0155847130a7c51cddf64188087ced6b8c2e7e37de93684eb6f7b402b1a3208c02a57a7717e0, '2015-03-27 14:54:55'),
(8, 'MEM_1286       ', 0x3130323031353034303930373139313630303030303030303230303031353531303439364d454d5f31323836202020202020203030312e30d942d8d2a4fbea1f01d537567924d2a1751aeaba604fd8ba7f87fb580f47a7b19819e81bd24bbd4eb98f74e701680801dbb001f444bf1f99ef1cbe8525fb7e0f5332513c4aa900d32b9f88a5737c14f9deb89796b60ca83cd4f9cb34d140518c70a5811afdbcba38b8bdf47b5801d4ae8ca1882cc0bfccd1ecf89f2f0f24dbb2, '2015-04-09 07:20:13'),
(10, 'MEM_1309       ', 0x3130323031353035303631373030333130303030303030303130303031353531303439364d454d5f31333039202020202020203933312e30078b916ea1f051f68b1802ca1b77ff1ae9e9c12d1cc6e6da5cf776c4795c8cfaed1a1630164652caff5ea354a49ee68339b5e4e6cf8dc7ece8d7240c26982f19dae27b3a1ee6e34ab55c49577335ae6b262e3b9dc3681e796b87c618472d6362944a652ec74d2417eb2864d3b844954a3257f72e1916299995db1af38ac9c23d, '2015-05-06 17:03:45'),
(36, 'DMEM_1385      ', 0x313032303135313032363138323132353030303030303030313030303135353130343936444d454d5f313338352020202020203030312e308966d863cdbd6a2974696d60fa9ef0428d23f7c461b0fd761cdc68072c6bfdf1a8858fa51bc8e806479798848fe03e366da177b5054bec95002e54d3d4a04acfd14c21131c1a6b32963ba6245abc179aee4f065604a14642598c09ef3c8095c387af33b355f965e42267b915d317745a3190f66e528d903a4fd05bbd5c342bac, '2015-10-26 18:22:23');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `payment_log`
--
ALTER TABLE `payment_log`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `payment_log`
--
ALTER TABLE `payment_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1000;
