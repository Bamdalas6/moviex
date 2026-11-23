/**
 * Nollywood films that TMDB's "origin country: Nigeria" listing misses, found by
 * cross-checking the catalogue on nollywood.com (titles only; no data is copied
 * from it) against TMDB in November 2026.
 *
 * Each id passed Marquee's rules when it was added: on TMDB with a poster and a
 * release date, not Hausa-language (Kannywood), not tagged on TMDB as another
 * industry (e.g. Ghana), and either tagged Nigerian or, with no country tag, with
 * at least two of its top-billed actors already credited on Nollywood films on
 * Marquee. The importer re-checks all of this every run.
 */
export const LISTED_NOLLYWOOD_TMDB_IDS: readonly number[] = [
  1755081, // A Father's Secret (2026) · cast: Timini Egbuson, Odunlade Adekola, Bryan Nonso Okoye
  1739969, // King KOSOKO (2026) · cast: Femi Adebayo, Odunlade Adekola, Jide Kosoko
  1696151, // Strong (2026) · cast: Sophie Alakija, Chris Okagbue
  1739959, // Sweet 16 (2026) · cast: Angel Unigwe, Alexx Ekubo, Uche Jombo
  1755470, // The Night of June 7th (2026) · cast: Femi Branch, Ali Nuhu, Gideon Okeke
  1722377, // A Valentine's Match (2025) · cast: Sophie Alakija, Etinosa Idemudia, Ray Adeka
  1524234, // Closure Mandate (2025) · cast: Jim Iyke, Anita Chris Nwaezeapu, Chris Attoh
  1517561, // Food for the Soul (2025) · cast: Karen Obilom, Richard Mofe-Damijo
  1578175, // Grandpa Must Obey (2025) · cast: Kanayo O. Kanayo, Elvina Ibru, Bimbo Akintola
  1455836, // I Am Anis (2025) · cast: Shaffy Bello, Martha Ehinome Orhiere, Lina Idoko
  1429942, // Love Lockdown (2025) · tagged Nigerian
  1753682, // Remi & Nneoma (2025) · cast: Bisola Aiyeola, Liz Benson, Eucharia Anunobi
  1484809, // Rent a Room (2025) · cast: Jim Iyke, Ini Edo, Uche Jombo
  1443202, // Revelations (2025) · cast: Richard Mofe-Damijo, Chioma Chukwuka
  1475054, // Shaping Us (2025) · cast: Uzoamaka Power, Bucci Franklin, Omowunmi Dada
  1389524, // Twin Flame (2025) · cast: Baaj Adebule, Idia Aisien, Jimmie Akinsola
  1490247, // Unclaimed (2025) · cast: Timini Egbuson, Elma Mbadiwe, Jaiye Kuti
  1405082, // A Danfo Christmas (2024) · cast: Demi Banwo, Patrick Doyle, Lydian John
  1383333, // A Ghetto Love Story (2024) · cast: Romeo Horsfall, Basketmouth, Dorathy Bachor
  1257629, // Insecure (2024) · cast: Beverly Naya, Venita Akpofure, Ade Laoye
  1451853, // Momiwa (2024) · cast: Uzor Arukwe, Blessing Jessica Obasi-Nze, Iyabo Ojo
  1269420, // Saving Onome (2024) · cast: Olumide Oworu, Nosa Rex, Nancy Isime
  1479149, // This Very Christmas (2024) · tagged Nigerian
  1376902, // When the Poor Smile (2024) · cast: Alvin Abayomi, Shaffy Bello, Juliet Ibrahim
  1323763, // With Difficulty Comes Ease (2024) · cast: Uzoamaka Power, Ummi Baba-Ahmed, Caleb Richards
  1027465, // A Song from the Dark (2023) · cast: Wale Ojo, Nse Ikpe-Etim
  1124592, // Àrìnfesèsí: A Day of Misfortune (2023) · cast: Babatunde Akinnayajo, Shawn Faqua, Jaiye Kuti
  1124699, // Dice (2023) · cast: Ademola Adedoyin, Allwell Ademola, Woli Arole
  1102809, // Different Strokes (2023) · cast: Uzor Arukwe, Stephen Damian, Francess Ben
  1212179, // Double Dekoi (2023) · cast: Sola Sobowale, Kanayo O. Kanayo, Baaj Adebule
  1084836, // Love In A Pandemic (2023) · cast: Nancy Isime, Deyemi Okanlawon, Teniola Aladese
  1213346, // No Way Through (2023) · cast: Funke Akindele, Chidi Mokeme, Chioma Chukwuka
  1306599, // Offshoot (2023) · cast: Kehinde Bankole, Kelechi Udegbe, Ibrahim Suleiman
  1228132, // Ogeere (2023) · cast: Shushu Abubakar, Akinola Akano, Clarion Chukwurah-Abiola
  1049467, // Orah (2023) · cast: Onyekachi Ejim, Somkele Iyamah Idhalama, Oris Erhuero
  1174917, // Strained (2023) · cast: Queen Nwokoye, Padita Agu
  1171306, // The Archive: Queer Nigerians (2023) · tagged Nigerian
  1238390, // The Best Worst Love Story Ever Told (2023) · cast: Ray Adeka, Ivy Blessing Agbo, Mary Ann Apollo
  1119006, // The Bloom Boys (2023) · cast: Adedayo Davies, Diane Russet, Tobi Bakre
  1414309, // The Switch (2023) · cast: Onyii Alex, IK Ogbonna, Bolaji Ogunmola
  983948, // Foreigner's God (2022) · cast: Onyeka Onwenu, Toyin Abraham, Annie Macauley
  1066891, // The Stand Up (2022) · cast: Daniel Abua, Dibor Adaobi, Anita Asuoha
  1724366, // Badboys and Bridesmaids (2021) · tagged Nigerian
  1065039, // Christmas in Miami (2021) · cast: Ayo Makun, Richard Mofe-Damijo
  871229, // Shadow Parties (2021) · cast: Jide Kosoko, Omotola Jalade-Ekeinde, Yemi Blaq
  843725, // A Soldier's Story 2: Return from the Dead (2020) · cast: Eric Roberts, Somkele Iyamah Idhalama, Linda Ejiofor
  1007286, // Double Strings (2020) · cast: Lilian Afegbai, Steve Asinobi, Ushbebe Comedian
  1031736, // Nollywood (2020) · cast: Ijeoma Grace Agu, Abba Makama, Don Omope
  1102012, // Ratnik (2020) · cast: Osas Ighodaro, Paul Utomi, Adunni Ade
  760452, // A Cemetery of Doves (2019) · tagged Nigerian
  882928, // Ikedi (2019) · cast: Sambasa Nzeribe, Ebube Nwagbo, Kachi Nnochiri
  1007842, // Jumbled (2019) · cast: Beverly Naya, Kenneth Okolie, Lilian Esoro
  631912, // Kasanova (2019) · cast: Toyin Abraham, Ruby Akubueze, Ireti Doyle
  749677, // Last Request (2019) · cast: Linda Osifo, Bimbo Akintola, Yemi Blaq
  659854, // Zero Hour (2019) · cast: Richard Mofe-Damijo, Alexx Ekubo, Ali Nuhu
  527307, // A Distant Cry (2018) · cast: Keppy Ekpenyong Bassey-Inyang, Kunle Coker, Nicolette Ndigwe
  882365, // A Friendly Fire (2018) · cast: Ebele Okaro-Onyiuke, Kenneth Okolie, Frankincense Eche-Ben
  882368, // A House Without A Home (2018) · cast: Lilian Esoro, Efe Irele, Ray Emodi
  514742, // Biological Clock (2018) · cast: Ruth Kadiri, Walter Anga, Stephen Damian
  665865, // God Calling (2018) · cast: Ademola Adedoyin, Zainab Balogun, Karibi Fubara
  591001, // If I Am President (2018) · cast: ayolola ayoola, Joke Silva, Ivie Okujaye
  882939, // In Every Way (2018) · cast: Frederick Leonard, Lota Chukwu, Emem Ufot
  527163, // Kokomma In America (2018) · cast: Evelyn Esin, Ime Bishop Umoh
  659856, // Lagos Real Fake Life (2018) · cast: Annie Idibia, IK Ogbonna, MC Lively
  514943, // Paranoia (2018) · cast: Ruth Kadiri, Ifeoma Odukwe
  514937, // Sex And Love (2018) · cast: Ruth Kadiri, Lisa Onu, Eddie Watson
  514907, // A Fire In The Rain (2017) · cast: Yvonne Jegede Fawole, Deyemi Okanlawon, Bolanle Ninalowo
  514930, // Baby Boy (2017) · cast: Ruth Kadiri, Tissy Nnachi, Peggy Ovire
  523807, // Banana Island Ghost (2017) · cast: Chioma Omeruah, Patrick Diabuah
  527115, // Ben Quick (2017) · cast: Alexx Ekubo, Emma Ayalogu, Bisola Aiyeola
  527134, // Bound by Tradition (2017) · cast: Liz Benson, Walter Anga, Andy Ike
  515703, // Broken Reed (2017) · cast: Daniel K. Daniel, Ruth Kadiri, Ebere Okafor
  665531, // Celebrity Marriage (2017) · cast: Kanayo O. Kanayo, Tonto Dikeh, Jackie Appiah
  527164, // Chasing Rainbows (2017) · cast: Oge Okoye, Padita Agu, Mofe Duncan
  514804, // Double Identity (2017) · cast: Jennifer Eliogu, Walter Anga, Chelsea Eze
  527098, // Fermented Sin (2017) · cast: Ayo Adesanya, Jennifer Eliogu, Saidi Balogun
  514736, // Flirting With Fifty (2017) · cast: Chinyere Wilfred, Onyii Alex, Vivian Pius
  516204, // Girls Are Not Smiling (2017) · cast: Evelyn Esin, Ruth Kadiri, Mary Lazarus
  811158, // Jane Rambo (2017) · cast: Gentle Jack, Kelvin Ikeduba
  518773, // King Invincible (2017) · cast: Gabriel Afolayan, Omowunmi Dada, Bimbo Manuel
  516268, // Love Lost (2017) · cast: Kelechi Udegbe, Anthony Monjaro, Mary Lazarus
  527549, // My Forever (2017) · cast: Ken Erics, Esther Audu
  527569, // Purple but not Purple (2017) · cast: Ireti Osayemi, Bimbo Akintola, Yvonne Jegede Fawole
  663528, // Slow Country (2017) · cast: Folaremi Agunbiade, Imoudu Ayonote, Gina Castel
  527594, // The Diary of A Crazy Nigerian Woman (2017) · cast: Deyemi Okanlawon, Chioma Nwosu, Enado Odigie
  426240, // The Price (2017) · tagged Nigerian
  514931, // To Be Again (2017) · cast: Desmond Elliot, Joseph Benjamin
  527328, // Adaku I (2016) · cast: Mercy Johnson Okojie, Ngozi Ezeonu, Walter Anga
  527327, // Adaku II (2016) · cast: Mercy Johnson Okojie, Ngozi Ezeonu, Walter Anga
  515759, // Baby Shower (2016) · cast: Arinze Okonkwo, Alexx Ekubo, Desmond Elliot
  527344, // Double Bind (2016) · cast: Kiki Omeili, Ifeanyi Kalu
  527357, // It’s About Your Husband (2016) · cast: Yemi Blaq, Chelsea Eze, Tamara Eteimo
  527363, // Judas kiss (2016) · cast: Akin Lewis, Femi Branch, Joseph Benjamin
  527541, // Love & Illusion (2016) · cast: Alexx Ekubo, Keppy Ekpenyong Bassey-Inyang, Jide Kosoko
  527544, // Moth to a Flame (2016) · cast: Kiki Omeili, Femi Jacobs, Lisa Omorodion
  515755, // My Name Is Kadi (2016) · cast: Tina Mba, Kenneth Okolie, Sylvia Oluchi
  527559, // No Strings Attached (2016) · cast: Ebere Okafor, Grace-Charis Bassey, Kenneth Okolie
  527566, // One Bite (2016) · cast: Seun Akindele, Kenneth Okolie, Taiwo Gasper
  527570, // Rebecca (2016) · cast: Joseph Benjamin, Yvonne Okoro
  527571, // Reconciliation (2016) · cast: Ini Edo, Arinze Okonkwo, Jennifer Uzoma
  1355591, // ROOM 315 (2016) · cast: Tina Mba, Bimbo Manuel, Gregory Ojefua
  527574, // Seed of Love (2016) · cast: Francis Duru, Bolanle Ninalowo, Florence Ngozi Sunday
  527585, // Shadow in the Mirror (2016) · cast: Femi Jacobs, Tissy Nnachi, Peggy Ovire
  516275, // Trouble Comes To Town (2016) · cast: Seun Akindele, Ruth Kadiri, Vivian Pius
  527598, // Birthmark (2015) · cast: Ini Edo, Bimbo Manuel, Femi Jacobs
  515708, // Don't Cry For Me (2015) · cast: Desmond Elliot, Joseph Benjamin, Yvonne Nelson
  527325, // Fine Girl (2015) · cast: Yvonne Jegede Fawole, Grace-Charis Bassey, Williams Uzor Arukwe
  527351, // Grey Dawn (2015) · cast: Bimbo Manuel, Sika Osei, Funlola Aofiyebi-Raimi
  527539, // Lipstick (2015) · cast: Ini Edo, Francis Duru, Thelma Okoduwa
  527606, // Pot of Life (2015) · cast: Clem Ohameze, Walter Anga, Yvonne Jegede Fawole
  527320, // While You Slept (2015) · cast: Joseph Benjamin, Venita Akpofure, Ini Edo
  338788, // 30 Days in Atlanta (2014) · cast: Ayodeji Richard Makun, Ramsey Nouah, Vivica A. Fox
  516144, // Bambitious (2014) · cast: Grace-Charis Bassey, Bucci Franklin
  759886, // Pretty Liars 2 (2014) · cast: Funke Akindele, Queen Nwokoye, Nse Ikpe-Etim
  473549, // When Love Happens (2014) · cast: Shaffy Bello, OC Ukeje, Oreka Godis
  527166, // Alero’s Symphony (2013) · cast: Ivie Okujaye, Bimbo Manuel, Victor Olaitan
  713616, // Delilah (2013) · cast: Patience Ozokwor, Cynthia Okereke, Ozo Akubueze
  515720, // Lonely Heart (2013) · cast: Desmond Elliot, Uche Jombo Rodriguez, Ime Bishop Umoh
  516273, // Murder At Prime Suites (2013) · cast: Joseph Benjamin, Chelsea Eze, Stan Nze
  527599, // Weekend Getaway (2013) · cast: Ini Edo, Genevieve Nnaji, Alexx Ekubo
  476757, // The Lost Number (2012) · tagged Nigerian
  515706, // Memories Of My Heart (2011) · cast: Ali Nuhu, Desmond Elliot, Ramsey Nouah
  383209, // Bursting Out (2010) · cast: Genevieve Nnaji, Majid Michel, Nse Ikpe-Etim
  516277, // Obscure Motives (2009) · cast: Bimbo Akintola, Yemi Blaq, Rukky Sanda
  1265789, // Only in America (2005) · cast: Pascal Atuma, Tanjareen Martin, Sandra Achums
  820105, // Blood Diamonds (2004) · cast: Hanks Anuku, Rita Dominic, Zulu Adigwe
  526921, // Passions (2003) · cast: Emeka Ike, Genevieve Nnaji, Florence Onuma
];
