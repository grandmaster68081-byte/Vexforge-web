import React from 'react';
import { Tabs } from 'expo-router';
import { VexforgeTabBar } from '../../src/app/TabBar';
import { COLORS } from '../../src/core/constants';
export default function TabLayout(){return <Tabs tabBar={(p)=><VexforgeTabBar {...p}/>} screenOptions={{header:()=>null,tabBarShowLabel:false,sceneStyle:{backgroundColor:COLORS.void},lazy:true}}><Tabs.Screen name="index"/><Tabs.Screen name="arena"/><Tabs.Screen name="archive"/><Tabs.Screen name="forge"/><Tabs.Screen name="legacy"/></Tabs>}
