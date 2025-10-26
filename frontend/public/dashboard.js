const { useState, useEffect, useRef } = React;

const AdvancedDashboard = () => {
  const [events, setEvents] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [scenarioActive, setScenarioActive] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventResponses, setEventResponses] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [responseAction, setResponseAction] = useState('');
  const [isSuspicious, setIsSuspicious] = useState(false);
  
  const eventsRef = useRef([]);

  useEffect(() => {
    let interval;
    if (sessionId && scenarioActive && !selectedEventId) {
      interval = setInterval(() => {
        fetchEvents();
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sessionId, scenarioActive, selectedEventId]);

  const startComplexScenario = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/scenarios/complex/advanced_phishing/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session_id);
        setScenarioActive(true);
        setEvents([]);
        setEventResponses({});
        setShowSummary(false);
        setSelectedEventId(null);
        eventsRef.current = [];
        
        setTimeout(fetchEvents, 2000);
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`http://localhost:8000/scenarios/complex/${sessionId}/events`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.events.length > eventsRef.current.length) {
          eventsRef.current = data.events;
          setEvents(data.events);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const selectEventForResponse = (eventId) => {
    if (eventResponses[eventId]) return;
    setSelectedEventId(eventId);
    setResponseAction('');
    setIsSuspicious(false);
  };

  const handleEventResponse = async () => {
    if (!selectedEventId || !responseAction) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/scenarios/complex/${sessionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEventId,
          action: responseAction,
          is_suspicious: isSuspicious
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setEventResponses(prev => ({
          ...prev,
          [selectedEventId]: {
            action: responseAction,
            isSuspicious: isSuspicious,
            evaluation: data.evaluation,
            feedback: data.feedback
          }
        }));
        
        setSelectedEventId(null);
        setResponseAction('');
        setIsSuspicious(false);
      }
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  const showScenarioSummary = async () => {
    try {
      const response = await fetch(`http://localhost:8000/scenarios/complex/${sessionId}/summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
        setShowSummary(true);
        setScenarioActive(false);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const getEventColor = (eventId) => {
    const hasResponse = eventResponses[eventId];
    
    if (hasResponse) {
      const evaluation = hasResponse.evaluation;
      if (evaluation.correct_suspicion && evaluation.correct_action) {
        return 'border-green-500 bg-green-50';
      } else if (evaluation.correct_suspicion || evaluation.correct_action) {
        return 'border-yellow-500 bg-yellow-50';
      } else {
        return 'border-red-500 bg-red-50';
      }
    } else {
      return 'border-blue-400 bg-blue-50';
    }
  };

  const getEventIcon = () => {
    return 'ℹ️';
  };

  const actions = [
    { value: 'monitor', label: 'Continue Monitoring', desc: 'Keep watching for more indicators' },
    { value: 'isolate', label: 'Isolate System', desc: 'Disconnect from network' },
    { value: 'block_ip', label: 'Block IP/Domain', desc: 'Add to firewall blocklist' },
    { value: 'escalate', label: 'Escalate to Security Team', desc: 'Alert senior analysts' },
    { value: 'reset_passwords', label: 'Force Password Reset', desc: 'Reset affected user passwords' },
    { value: 'shutdown', label: 'Emergency Shutdown', desc: 'Shutdown affected systems' }
  ];

  const selectedEvent = selectedEventId ? events.find(e => e.event_id === selectedEventId) : null;

  return React.createElement('div', { className: 'min-h-screen bg-gray-100 p-6' },
    React.createElement('div', { className: 'max-w-6xl mx-auto' },
      
      React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-6' },
        React.createElement('div', { className: 'flex items-center justify-between' },
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('a', {
              href: 'index.html',
              className: 'px-3 py-2 text-gray-600 hover:text-gray-900 transition'
            }, '← Home'),
            React.createElement('h1', { className: 'text-2xl font-bold text-gray-800' },
              'Advanced Incident Response Training'
            )
          ),
          React.createElement('div', { className: 'flex items-center space-x-4' },
            React.createElement('div', { 
              className: `px-3 py-1 rounded-full text-sm font-medium ${
                scenarioActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }` 
            }, scenarioActive ? 'Scenario Active' : 'Ready to Start'),
            
            !scenarioActive && !showSummary && React.createElement('button', {
              onClick: startComplexScenario,
              disabled: loading,
              className: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
            }, loading ? 'Starting...' : 'Start Advanced Scenario'),
            
            scenarioActive && React.createElement('button', {
              onClick: showScenarioSummary,
              className: 'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700'
            }, 'Complete & View Summary')
          )
        )
      ),

      showSummary ? (
        React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-8' },
          React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-8 text-center' },
            'Simulation Results'
          ),
          
          summary && React.createElement('div', { className: 'space-y-8' },
            
            React.createElement('div', { className: 'bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6' },
              React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                'General Performance'
              ),
              React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6' },
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-4xl font-bold text-blue-600' },
                    `${summary.overall_performance.total_score}/${summary.overall_performance.max_possible_score}`
                  ),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 'Total Score')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { className: 'text-4xl font-bold text-green-600' },
                    `${summary.overall_performance.overall_accuracy}%`
                  ),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 'Overall Accuracy')
                ),
                React.createElement('div', { className: 'text-center' },
                  React.createElement('div', { 
                    className: `text-4xl font-bold ${
                      summary.overall_performance.letter_grade === 'A' ? 'text-green-600' :
                      summary.overall_performance.letter_grade === 'B' ? 'text-blue-600' :
                      summary.overall_performance.letter_grade === 'C' ? 'text-yellow-600' :
                      'text-red-600'
                    }`
                  }, summary.overall_performance.letter_grade),
                  React.createElement('div', { className: 'text-sm text-gray-600' }, 'Grade')
                )
              )
            ),

            React.createElement('div', { className: 'bg-gray-50 rounded-lg p-6' },
              React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                'Event Statistics'
              ),
              React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
                React.createElement('div', { className: 'text-center p-3 bg-white rounded' },
                  React.createElement('div', { className: 'text-2xl font-bold text-gray-800' },
                    summary.event_statistics.total_events
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, 'Total Events')
                ),
                React.createElement('div', { className: 'text-center p-3 bg-white rounded' },
                  React.createElement('div', { className: 'text-2xl font-bold text-red-600' },
                    summary.event_statistics.total_suspicious_events
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, 'Suspicious Events')
                ),
                React.createElement('div', { className: 'text-center p-3 bg-white rounded' },
                  React.createElement('div', { className: 'text-2xl font-bold text-green-600' },
                    summary.event_statistics.events_responded_to
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, 'Responded')
                ),
                React.createElement('div', { className: 'text-center p-3 bg-white rounded' },
                  React.createElement('div', { className: 'text-2xl font-bold text-orange-600' },
                    summary.event_statistics.unanswered_events
                  ),
                  React.createElement('div', { className: 'text-xs text-gray-600' }, 'Unanswered')
                )
              )
            ),

            React.createElement('div', { className: 'bg-white border border-gray-200 rounded-lg p-6' },
              React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                'Detailed Event Results'
              ),
              React.createElement('div', { className: 'space-y-3 max-h-96 overflow-y-auto' },
                summary.detailed_results.map((event, index) =>
                  React.createElement('div', {
                    key: event.event_id,
                    className: `p-4 border rounded-lg ${
                      event.responded ? 
                        (event.suspicion_correct && event.action_correct ? 'border-green-300 bg-green-50' :
                         event.suspicion_correct || event.action_correct ? 'border-yellow-300 bg-yellow-50' :
                         'border-red-300 bg-red-50') :
                        'border-gray-300 bg-gray-50'
                    }`
                  },
                    React.createElement('div', { className: 'flex justify-between items-start' },
                      React.createElement('div', { className: 'flex-1' },
                        React.createElement('p', { className: 'font-medium text-sm mb-2' }, event.message),
                        React.createElement('div', { className: 'text-xs space-y-1' },
                          React.createElement('p', null, `✓ Suspicious: ${event.actual_suspicion ? 'Yes' : 'No'}`),
                          React.createElement('p', null, `✓ Correct Actions: ${event.correct_action_options.join(', ')}`),
                          React.createElement('p', { className: 'text-gray-600 italic' }, event.explanation)
                        )
                      ),
                      React.createElement('div', { className: 'text-right text-xs' },
                        event.responded ? 
                          React.createElement('div', null,
                            React.createElement('p', { 
                              className: event.suspicion_correct ? 'text-green-600' : 'text-red-600'
                            }, `Identified: ${event.student_marked_suspicious ? 'Suspicious' : 'Normal'}`),
                            React.createElement('p', { 
                              className: event.action_correct ? 'text-green-600' : 'text-red-600'
                            }, `Action: ${event.student_action}`),
                            React.createElement('p', { className: 'font-bold' }, `${event.points_earned}/50 points`)
                          ) :
                          React.createElement('p', { className: 'text-orange-600 font-medium' }, 'Not Responded\n0/50 points')
                      )
                    )
                  )
                )
              )
            ),

            React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-6' },
              React.createElement('h3', { className: 'text-lg font-semibold text-blue-800 mb-4' },
                'Recommendations for Improvement'
              ),
              React.createElement('ul', { className: 'space-y-2' },
                summary.recommendations.map((rec, index) =>
                  React.createElement('li', { 
                    key: index, 
                    className: 'flex items-start text-sm text-blue-700'
                  },
                    React.createElement('span', { className: 'text-blue-500 mr-2' }, '•'),
                    rec
                  )
                )
              )
            ),
            
            React.createElement('div', { className: 'flex justify-center space-x-4' },
              React.createElement('a', {
                href: 'index.html',
                className: 'px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium'
              }, 'Back to Home'),
              React.createElement('button', {
                onClick: () => window.location.reload(),
                className: 'px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium'
              }, 'Try Another Simulation')
            )
          )
        )
      ) : (
        React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
          
          React.createElement('div', { className: 'lg:col-span-2' },
            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
              React.createElement('div', { className: 'flex items-center justify-between mb-4' },
                React.createElement('h2', { className: 'text-xl font-semibold text-gray-800' },
                  'Security Events Feed'
                ),
                React.createElement('div', { className: 'text-sm text-gray-600' },
                  `${events.length} events • ${Object.keys(eventResponses).length} responded`
                )
              ),
              
              React.createElement('div', { className: 'space-y-3 max-h-96 overflow-y-auto' },
                events.map(event => {
                  const hasResponse = eventResponses[event.event_id];
                  const isSelected = selectedEventId === event.event_id;
                  const borderColor = getEventColor(event.event_id);
                  
                  return React.createElement('div', {
                    key: event.event_id,
                    className: `p-4 border-l-4 rounded-r-lg transition-all ${borderColor} ${
                      isSelected ? 'ring-2 ring-blue-300' : 'cursor-pointer hover:shadow-md'
                    }`,
                    onClick: () => !hasResponse && !isSelected && selectEventForResponse(event.event_id)
                  },
                    React.createElement('div', { className: 'flex items-start justify-between' },
                      React.createElement('div', { className: 'flex items-start space-x-3' },
                        React.createElement('span', { className: 'text-lg' }, getEventIcon()),
                        React.createElement('div', { className: 'flex-1' },
                          React.createElement('p', { className: 'text-sm font-medium text-gray-800' },
                            event.message
                          ),
                          React.createElement('p', { className: 'text-xs text-gray-500 mt-1' },
                            `${event.source} • ${new Date(event.timestamp).toLocaleTimeString()}`
                          ),
                          
                          hasResponse && React.createElement('div', { className: 'mt-2 text-xs' },
                            React.createElement('div', { className: 'flex items-center space-x-2' },
                              React.createElement('span', { 
                                className: `px-2 py-1 rounded ${
                                  hasResponse.evaluation.correct_suspicion ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`
                              }, hasResponse.isSuspicious ? 'Marked: Suspicious' : 'Marked: Normal'),
                              React.createElement('span', { 
                                className: `px-2 py-1 rounded ${
                                  hasResponse.evaluation.correct_action ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`
                              }, `Action: ${hasResponse.action}`),
                              React.createElement('span', { className: 'font-medium' },
                                `Score: ${hasResponse.evaluation.score}/50`
                              )
                            )
                          )
                        )
                      ),
                      React.createElement('div', { className: 'flex flex-col items-end' },
                        React.createElement('span', { className: 'px-2 py-1 text-xs rounded font-medium bg-blue-100 text-blue-800' }, 
                          'INFO'
                        ),
                        
                        !hasResponse && !isSelected && React.createElement('button', {
                          className: 'mt-2 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700',
                          onClick: (e) => {
                            e.stopPropagation();
                            selectEventForResponse(event.event_id);
                          }
                        }, 'Respond'),

                        isSelected && React.createElement('span', {
                          className: 'mt-2 px-3 py-1 text-xs bg-orange-100 text-orange-800 rounded'
                        }, 'Selected')
                      )
                    )
                  );
                })
              )
            )
          ),

          React.createElement('div', { className: 'space-y-6' },
            selectedEvent ? (
              React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                  'Respond to Selected Event'
                ),
                
                React.createElement('div', { className: 'p-3 rounded-lg mb-4 bg-blue-50 border border-blue-200' },
                  React.createElement('p', { className: 'font-medium text-sm' }, selectedEvent.message),
                  React.createElement('p', { className: 'text-xs text-gray-600 mt-1' }, 
                    `${selectedEvent.source} • ${new Date(selectedEvent.timestamp).toLocaleTimeString()}`
                  )
                ),

                React.createElement('div', { className: 'mb-4' },
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                    'Is this event suspicious?'
                  ),
                  React.createElement('div', { className: 'flex space-x-4' },
                    React.createElement('label', { className: 'flex items-center' },
                      React.createElement('input', {
                        type: 'radio',
                        name: 'suspicious',
                        checked: !isSuspicious,
                        onChange: () => setIsSuspicious(false),
                        className: 'mr-2'
                      }),
                      'Normal Activity'
                    ),
                    React.createElement('label', { className: 'flex items-center' },
                      React.createElement('input', {
                        type: 'radio',
                        name: 'suspicious',
                        checked: isSuspicious,
                        onChange: () => setIsSuspicious(true),
                        className: 'mr-2'
                      }),
                      'Suspicious Activity'
                    )
                  )
                ),

                React.createElement('div', { className: 'mb-4' },
                  React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' },
                    'Select Response Action:'
                  ),
                  React.createElement('div', { className: 'grid grid-cols-1 gap-2' },
                    actions.map(actionOption =>
                      React.createElement('label', {
                        key: actionOption.value,
                        className: `flex items-center p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                          responseAction === actionOption.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`
                      },
                        React.createElement('input', {
                          type: 'radio',
                          name: 'action',
                          value: actionOption.value,
                          checked: responseAction === actionOption.value,
                          onChange: (e) => setResponseAction(e.target.value),
                          className: 'mr-3'
                        }),
                        React.createElement('div', null,
                          React.createElement('div', { className: 'font-medium text-sm' }, actionOption.label),
                          React.createElement('div', { className: 'text-xs text-gray-600' }, actionOption.desc)
                        )
                      )
                    )
                  )
                ),

                React.createElement('div', { className: 'flex space-x-3' },
                  React.createElement('button', {
                    onClick: () => setSelectedEventId(null),
                    className: 'flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50'
                  }, 'Cancel'),
                  React.createElement('button', {
                    onClick: handleEventResponse,
                    disabled: !responseAction || loading,
                    className: 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  }, loading ? 'Submitting...' : 'Submit Response')
                )
              )
            ) : (
              React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
                React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                  'Instructions'
                ),
                React.createElement('div', { className: 'text-sm text-gray-600 space-y-2' },
                  React.createElement('p', null, '1. Events will appear gradually in the feed'),
                  React.createElement('p', null, '2. Click on any event to respond to it'),
                  React.createElement('p', null, '3. Determine if the event is suspicious'),
                  React.createElement('p', null, '4. Choose the appropriate response action'),
                  React.createElement('p', null, '5. Submit your response to get feedback')
                )
              )
            ),

            React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
              React.createElement('h3', { className: 'text-lg font-semibold text-gray-800 mb-4' },
                'Current Scenario'
              ),
              React.createElement('div', { className: 'space-y-2 text-sm' },
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', null, 'Type:'),
                  React.createElement('span', { className: 'font-medium' }, 'Multi-Stage Attack')
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', null, 'Difficulty:'),
                  React.createElement('span', { className: 'font-medium' }, 'Intermediate')
                ),
                React.createElement('div', { className: 'flex justify-between' },
                  React.createElement('span', null, 'Status:'),
                  React.createElement('span', { 
                    className: `font-medium ${
                      scenarioActive ? 'text-green-600' : 'text-gray-600'
                    }`
                  }, scenarioActive ? 'Active' : 'Inactive')
                )
              )
            )
          )
        )
      )
    )
  );
};

ReactDOM.render(React.createElement(AdvancedDashboard), document.getElementById('root'));
