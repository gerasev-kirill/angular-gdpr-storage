angular.module('gdpr.storage')


.config (storageSettingsProvider)->
    GA = [
        {
            key: '_ga'
            provider: 'google.com'
            purpose: 'Used to distinguish users'
            expiry: '2 years'
            type: 'HTTP cookie'
        },{
            key: '_gid'
            provider: 'google.com'
            purpose: '24 hours'
            expiry: 'Used to distinguish users'
            type: 'HTTP cookie'
        },{
            key: '_gat'
            provider: 'google.com'
            purpose: 'Used to throttle request rate. If Google Analytics is deployed via Google Tag Manager, this cookie will be named _dc_gtm_<property-id>'
            expiry: '1 minute'
            type: 'HTTP cookie'
        },{
            key: 'AMP_TOKEN'
            provider: 'google.com'
            purpose: 'Contains a token that can be used to retrieve a Client ID from AMP Client ID service. Other possible values indicate opt-out, inflight request or an error retrieving a Client ID from AMP Client ID service'
            expiry: '30 seconds to 1 year'
            type: 'HTTP cookie'
        },{
            key: '_gac_<property-id>'
            provider: 'google.com'
            purpose: 'Contains campaign related information for the user'
            expiry: '90 days'
            type: 'HTTP cookie'
        },{
            key: '__utma'
            provider: 'google.com'
            purpose: 'Used to distinguish users and sessions. The cookie is created when the javascript library executes and no existing __utma cookies exists. The cookie is updated every time data is sent to Google Analytics'
            expiry: '2 years from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmt'
            provider: 'google.com'
            purpose: 'Used to throttle request rate'
            expiry: '10 minutes'
            type: 'HTTP cookie'
        },{
            key: '__utmb'
            provider: 'google.com'
            purpose: 'Used to determine new sessions/visits. The cookie is created when the javascript library executes and no existing __utmb cookies exists. The cookie is updated every time data is sent to Google Analytics'
            expiry: '30 mins from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmz'
            provider: 'google.com'
            purpose: 'Stores the traffic source or campaign that explains how the user reached your site. The cookie is created when the javascript library executes and is updated every time data is sent to Google Analytics'
            expiry: '6 months from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmv'
            provider: 'google.com'
            purpose: 'Used to store visitor-level custom variable data'
            expiry: '2 years from set/update'
            type: 'HTTP cookie'
        },{
            key: '__utmx'
            provider: 'google.com'
            purpose: "Used to determine a user's inclusion in an experiment"
            expiry: '18 months'
            type: 'HTTP cookie'
        },{
            key: '__utmxx'
            provider: 'google.com'
            purpose: 'Used to determine the expiry of experiments a user has been included in'
            expiry: '18 months'
            type: 'HTTP cookie'
        },{
            key: '_gaexp'
            provider: 'google.com'
            purpose: "Used to determine a user's inclusion in an experiment and the expiry of experiments a user has been included in"
            expiry: 'Depends on the length of the experiment but typically 90 days'
            type: 'HTTP cookie'
        }
    ]
    jivosite = [
        {
            key: 'jv_enter_ts_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'First visit to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_visits_count_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Number of visits to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_pages_count_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Number of pages viewed'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_refer_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Source of entry to the website'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_utm_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'ID of the marketing campaign of the visit'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_invitation_time_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time of appearance of proactive invitation'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_country_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Country of the visitor'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_city_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'City of the visitor'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_close_time_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time the widget was closed'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_cw_timer_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Time the callback request was initiated'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_callback_ping_response_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Cash of callback backend script response'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_use_lp_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Flag that enables long_pooling'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_mframe_protected_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'Indication if iframe is forbidden'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        },{
            key: 'jv_ab_test_group_${jivo_visitor_id}'
            provider: 'jivochat.com'
            purpose: 'a/b testing group flag'
            expiry: '12 hours from set/update'
            type: 'HTTP cookie'
        }
    ]

    storageSettingsProvider.registerThirdPartyServiceLiteral('ga', {
        type: 'ga'
        name: 'Google Analytics'
        cookies: GA
    })
    storageSettingsProvider.registerThirdPartyServiceLiteral('jivosite', {
        type: 'jivosite'
        name: 'Jivochat'
        cookies: jivosite
    })
    return
