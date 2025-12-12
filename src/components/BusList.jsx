
import React from 'react';

// Helper to map busType
const getBusTypeLabel = (type) => {
    switch(type) {
        case '1': return 'Large'; // 大巴
        case '2': return 'Medium'; // 中巴
        case '3': return 'Small'; // 小巴
        default: return type;
    }
};

const BusList = ({ stops }) => {
    return (
        <div className="relative pl-4 border-l-2 border-gray-200 ml-4 space-y-8 pb-10">
            {stops.map((stop, index) => (
                <div key={stop.busstopcode || index} className="relative">
                    {/* Timeline Line Segment (Connects to next stop) */}
                    {index < stops.length - 1 && (
                        <div className={`absolute left-0 top-2 bottom-[-40px] w-1.5 z-0 transition-colors duration-500
                            ${(!stop.trafficLevel || stop.trafficLevel <= 0) ? 'bg-gray-300' : ''}
                            ${stop.trafficLevel == 1 ? 'bg-green-500' : ''}
                            ${stop.trafficLevel == 2 ? 'bg-yellow-400' : ''}
                            ${stop.trafficLevel >= 3 ? 'bg-red-500' : ''}
                        `}>
                        </div>
                    )}
                    
                    {/* Stop Dot */}
                    <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 ${
                        stop.buses.some(b => b.status === '1') 
                        ? 'bg-blue-500 border-blue-500 animate-pulse'
                        : stop.trafficLevel >= 3 
                          ? 'bg-white border-red-500' 
                          : stop.trafficLevel === 2 
                            ? 'bg-white border-yellow-500' 
                            : stop.trafficLevel === 1
                              ? 'bg-white border-green-500'
                              : 'bg-white border-gray-300'
                    }`}></div>
                    
                    {/* Arrived Buses (Status 1) */}
                    {stop.buses.filter(b => b.status === '1').length > 0 && (
                         <div className="absolute top-0 -left-36 w-32 flex flex-col items-end gap-1 z-20 transform -translate-y-1">
                            {stop.buses.filter(b => b.status === '1').map((bus, bi) => (
                                <div key={bi} className="flex flex-col items-end gap-1 z-20 w-full">
                                    <div className="bg-white border border-blue-500 text-blue-700 text-xs px-2 py-1 rounded-full shadow-sm flex items-center justify-end gap-1 whitespace-nowrap w-full">
                                        <span className="font-bold">{bus.busPlate}</span>
                                        <span>🚌</span>
                                        <span className="text-[10px] font-medium border-l border-blue-200 pl-1 ml-0.5">
                                            {bus.speed}km/h
                                        </span>
                                    </div>
                                    <div className="flex gap-1 justify-end w-full flex-wrap">
                                        {bus.busType && (
                                            <div className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 rounded-full shadow-sm whitespace-nowrap">
                                                {getBusTypeLabel(bus.busType)}
                                            </div>
                                        )}
                                        {bus.isFacilities === '1' && (
                                            <div className="text-[9px] bg-blue-100 text-blue-800 border border-blue-200 px-1 rounded-full shadow-sm" title="Wheelchair Accessible">
                                                ♿
                                            </div>
                                        )}
                                        {parseInt(bus.passengerFlow) > -1 && (
                                            <div className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 rounded-full shadow-sm whitespace-nowrap">
                                                👤 {bus.passengerFlow}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                         </div>
                    )}
                    
                     {/* Stop Name & Code */}
                    <div className="pl-4"> 
                        <div className="font-bold text-gray-800 text-sm leading-none">{index + 1}. {stop.staName}</div>
                        <div className="text-xs text-gray-400 mt-1 flex gap-2 items-center">
                            <span>{stop.staCode}</span>
                            {stop.laneName && <span className="text-teal-600 bg-teal-50 px-1 rounded border border-teal-100">{stop.laneName}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BusList;
