import { VexforgeImage } from '../src/render/VexforgeImage';
import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold, Cinzel_900Black } from '@expo-google-fonts/cinzel';
import { Rajdhani_500Medium, Rajdhani_600SemiBold, Rajdhani_700Bold } from '@expo-google-fonts/rajdhani';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GameProvider } from '../src/app/GameProvider';
import { RuntimeHeader } from '../src/app/RuntimeHeader';
import Animated,{Easing,useAnimatedStyle,useSharedValue,withRepeat,withSequence,withTiming} from 'react-native-reanimated';
import { View,Text,StyleSheet } from 'react-native';
import { COLORS } from '../src/core/constants';
import { RuntimeErrorBoundary } from '../src/components/RuntimeErrorBoundary';
SplashScreen.preventAutoHideAsync().catch(()=>undefined);
const queryClient=new QueryClient();
const STARTUP_SCENE=require('../assets/vexforge/scenes/nexus.jpg');
function StartupCurtain(){const pulse=useSharedValue(.88);React.useEffect(()=>{pulse.value=withRepeat(withSequence(withTiming(1.08,{duration:950,easing:Easing.inOut(Easing.sin)}),withTiming(.9,{duration:950,easing:Easing.inOut(Easing.sin)})),-1,false)},[pulse]);const a=useAnimatedStyle(()=>({transform:[{scale:pulse.value}]}));return <View style={startup.root}><VexforgeImage source={STARTUP_SCENE} cacheMode="memory-disk" resizeMode="cover" style={StyleSheet.absoluteFillObject}/><View style={startup.scrim}/><Animated.View style={[startup.sigil,a]}><Text style={startup.sigText}>✦</Text></Animated.View><Text style={startup.brand}>VEXFORGE</Text><Text style={startup.sub}>THE NEXUS IS FORGING</Text></View>}
export default function RootLayout(){const[loaded]=useFonts({Cinzel_700Bold,Cinzel_900Black,Rajdhani_500Medium,Rajdhani_600SemiBold,Rajdhani_700Bold,Inter_400Regular,Inter_500Medium,Inter_700Bold});React.useEffect(()=>{if(loaded)void SplashScreen.hideAsync()},[loaded]);if(!loaded)return <StartupCurtain/>;return <RuntimeErrorBoundary><GestureHandlerRootView style={{flex:1,backgroundColor:COLORS.void}}><SafeAreaProvider><QueryClientProvider client={queryClient}><GameProvider><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:COLORS.void},animation:'fade'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="missions"/><Stack.Screen name="store"/><Stack.Screen name="economy"/><Stack.Screen name="world"/><Stack.Screen name="social"/><Stack.Screen name="meta"/><Stack.Screen name="tutorial"/><Stack.Screen name="auth"/></Stack></GameProvider></QueryClientProvider></SafeAreaProvider></GestureHandlerRootView></RuntimeErrorBoundary>}

const startup=StyleSheet.create({root:{flex:1,backgroundColor:COLORS.void,alignItems:'center',justifyContent:'center',overflow:'hidden'},scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(2,2,7,.74)'},sigil:{width:118,height:118,borderRadius:59,borderWidth:1,borderColor:`${COLORS.gold}66`,backgroundColor:`${COLORS.gold}0B`,alignItems:'center',justifyContent:'center',shadowColor:COLORS.goldBright,shadowOpacity:.7,shadowRadius:40},sigText:{color:COLORS.goldBright,fontSize:50,fontWeight:'900'},brand:{color:COLORS.white,fontSize:25,fontWeight:'900',letterSpacing:4,marginTop:18},sub:{color:COLORS.goldDim,fontSize:6,fontWeight:'900',letterSpacing:2,marginTop:6}});
