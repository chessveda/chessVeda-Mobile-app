import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { AuthContext } from "@/components/context/authContext";
import axios from "axios";
import moment from "moment";
import Icon from "react-native-vector-icons/Ionicons";
import {
  VictoryArea,
  VictoryChart,
  VictoryTheme,
  VictoryAxis,
} from "victory-native";
import { EXPO_PUBLIC_API_URL } from "@env";

const { width } = Dimensions.get("window");

const API_URL = EXPO_PUBLIC_API_URL


const Profile = () => {
  const auth = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [selectedMode, setSelectedMode] = useState("Rapid");

  const data = [
    { x: "Jul", y: 1050 },
    { x: "Aug", y: 1100 },
    { x: "Sep", y: 1300 },
    { x: "Oct", y: 1200 },
    { x: "Nov", y: 1150 },
    { x: "Dec", y: 1400 },
  ];

  const recentGames = [
    {
      id: "1",
      type: "bullet",
      opponent: "Koby (1304)",
      result: "-",
      avatar:
        "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
    {
      id: "2",
      type: "rapid",
      opponent: "Koby (1304)",
      result: "-",
      avatar:
        "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
    {
      id: "3",
      type: "bullet",
      opponent: "Koby (1304)",
      result: "-",
      avatar:
        "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
    {
      id: "4",
      type: "bullet",
      opponent: "Koby (1304)",
      result: "-",
      avatar:
        "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
    {
      id: "5",
      type: "bullet",
      opponent: "Koby (1304)",
      result: "-",
      avatar:
        "https://images.pexels.com/photos/30594684/pexels-photo-30594684/free-photo-of-tropical-sunset-with-kite-and-crescent-moon.jpeg?auto=compress&cs=tinysrgb&w=1200&lazy=load",
    },
  ];

  const gameTypes = [
    { name: "Rapid", icon: require("../../assets/images/rapid.svg"), rating: "1430" },
    { name: "Bullet", icon: require("../../assets/images/bulletSvg.svg"), rating: "1254" },
    { name: "Daily", icon: require("../../assets/images/daily.svg"), rating: "1200" },
    { name: "Classical", icon: require("../../assets/images/classical.svg"), rating: "1430" },
    { name: "Blitz", icon: require("../../assets/images/blitz.svg"), rating: "892" },
    { name: "Freestyle", icon: require("../../assets/images/freestyle.svg"), rating: "400" },
];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/profile/${auth.userId}`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          }
        );
        setProfile(response.data.user);
      } catch (err) {
        console.log(err);
      }
    };
    fetchProfile();
  }, []);

  const renderGameItem = ({ item }) => (
    <View>
      <View style={styles.gameItem}>
        <View style={styles.gameInfo}>
          <Image
            source={
              item.type === "bullet"
                ? require("../../assets/images/bullet.png")
                : require("../../assets/images/rapid.png")
            }
            style={styles.gameIcon}
          />
          <View style={styles.opponentInfo}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <Text style={styles.opponentName}>{item.opponent}</Text>
          </View>
        </View>
        <View style={styles.gameResult}>
          <View style={styles.resultBadge}>
            <Text style={styles.resultText}>{item.result}</Text>
          </View>
          <Icon name="arrow-forward" size={24} color="#fff" />
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView>
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <Icon name="person-circle-outline" size={80} color="#808080" />
          <View style={styles.profileText}>
            <Text style={styles.profileName}>
              {profile ? `Hello, ${profile?.name}` : "Hello, There"}
            </Text>
            <Text style={styles.profileTitle}>Super Challenger</Text>
          </View>
        </View>
        <View style={styles.profileMeta}>
          <View style={styles.metaItem}>
            <Icon name="calendar-outline" size={24} color="#808080" />
            <Text style={styles.metaText}>
              {profile ? moment(profile?.dob).format("MMM Do YY") : ""}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="location-outline" size={24} color="#808080" />
            <Text style={styles.metaText}>{profile?.country}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gameTypesContainer}
        >
        {gameTypes.map((game, index) => (
          <View key={index} style={styles.gameTypeCard}>
            <View style={styles.gameTypeInfo}>
              <Image source={game.icon} style={styles.gameTypeIcon} />
              <Text style={styles.gameTypeName}>{game.name}</Text>
            </View>
            <Text style={styles.gameTypeRating}>{game.rating}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.contentContainer}>
        <View style={styles.recentGames}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Games</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentGames}
            renderItem={renderGameItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            />
        </View>

        <View style={styles.ratingActivity}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Rating Activity</Text>
            <TouchableOpacity
              style={styles.modeSelector}
              onPress={() =>
                setSelectedMode((prev) => (prev === "Rapid" ? "Bullet" : "Rapid"))
              }
              >
              <Text style={styles.modeText}>{selectedMode}</Text>
              <Icon name="chevron-down-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={{ height: 300 }}>
          <View style={{ height: 300 }}>
          <VictoryChart
            theme={VictoryTheme.material}
            >
            <VictoryAxis
              style={{
                axis: { stroke: "#666" },
                tickLabels: { fill: "#666", fontSize: 12 },
              }}
              />
            <VictoryArea
              data={data}
              style={{
                data: {
                  fill: "#4169E1",
                  stroke: "#4169E1",
                  strokeWidth: 2,
                  fillOpacity: 0.2,
                },
              }}
              interpolation="natural"
              />
            <VictoryAxis
              dependentAxis
              style={{
                axis: { stroke: "none" },
                tickLabels: { fill: "none" },
              }}
              />
          </VictoryChart>
          </View>
        </View>
      </View>
      </View>
    </ScrollView>
              </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  profileHeader: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  profileText: {
    marginLeft: 16,
  },
  profileName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  profileTitle: {
    color: "#808080",
    fontSize: 16,
  },
  profileMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    color: "#fff",
    marginLeft: 8,
  },
  gameTypesContainer: {
    marginBottom: 16,
  },
  gameTypeCard: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 150,
    height: 100,
    justifyContent: "space-between",
  },
  gameTypeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameTypeIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  gameTypeName: {
    color: "#808080",
    fontSize: 14,
  },
  gameTypeRating: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    alignSelf: "flex-end",
  },
  contentContainer: {
    flexDirection: "column",
  },
  recentGames: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAll: {
    color: "#fff",
    textDecorationLine: "underline",
  },
  gameItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  gameInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  gameIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  opponentInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  opponentName: {
    color: "#fff",
    fontSize: 16,
  },
  gameResult: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultBadge: {
    width: 32,
    height: 32,
    backgroundColor: "#4169E1",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  resultText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#3D3D3D",
  },
  ratingActivity: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
  },
  modeSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeText: {
    color: "#fff",
    fontWeight: "600",
    marginRight: 4,
  },
});

export default Profile;