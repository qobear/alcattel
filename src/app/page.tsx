import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 overflow-hidden">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span className="text-2xl font-bold text-emerald-600 animate-pulse">🐄</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                AllCattle
              </span>
              <Badge variant="secondary" className="ml-2 bg-emerald-100 text-emerald-700 animate-fade-in">
                v2.0
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300" asChild>
                <Link href="/features">Features</Link>
              </Button>
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" className="hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-300" asChild>
                <Link href="/about">About</Link>
              </Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" asChild>
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Floating Elements Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-emerald-300 rounded-full opacity-20 animate-bounce delay-0"></div>
          <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-teal-300 rounded-full opacity-30 animate-bounce delay-300"></div>
          <div className="absolute bottom-1/4 left-1/3 w-5 h-5 bg-cyan-300 rounded-full opacity-25 animate-bounce delay-700"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-emerald-400 rounded-full opacity-40 animate-pulse"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="inline-flex items-center px-6 py-3 mb-8 text-sm font-medium text-emerald-800 bg-emerald-100 rounded-full border border-emerald-200 shadow-sm animate-fade-in-up">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 mr-2"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 mr-3"></span>
            🚀 The Future of Livestock Management is Here
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl lg:text-8xl mb-8 animate-fade-in-up delay-200">
            <span className="block transform hover:scale-105 transition-transform duration-300">AllCattle</span>
            <span className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-gradient-shift">
              Connect. Track. Thrive.
            </span>
          </h1>
          
          <p className="max-w-4xl mx-auto mt-6 text-xl text-gray-600 leading-relaxed animate-fade-in-up delay-400">
            The world's most comprehensive livestock management platform that seamlessly connects 
            <span className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-default"> farm operations</span>, 
            <span className="font-bold text-teal-600 hover:text-teal-700 transition-colors cursor-default"> management teams</span>, and 
            <span className="font-bold text-cyan-600 hover:text-cyan-700 transition-colors cursor-default"> supply chain partners</span> 
            in one intelligent, scalable ecosystem.
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 mb-10 animate-fade-in-up delay-600">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">10,000+</div>
              <div className="text-sm text-gray-600">Animals Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">500+</div>
              <div className="text-sm text-gray-600">Farms Connected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-600">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-600">Support</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12 animate-fade-in-up delay-800">
            <Button 
              size="lg" 
              className="px-10 py-5 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group" 
              asChild
            >
              <Link href="/auth/signin">
                <span className="mr-2">🚀</span>
                Start Your Journey
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-10 py-5 text-lg font-semibold border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group" 
              asChild
            >
              <Link href="/demo">
                <span className="mr-2">▶️</span>
                Watch Demo
                <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full group-hover:bg-emerald-200 transition-colors">3 min</span>
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 animate-fade-in-up delay-1000">
            <p className="text-sm text-gray-500 mb-6">Trusted by leading agricultural organizations worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="text-gray-400 font-semibold">🏢 AgriCorp</div>
              <div className="text-gray-400 font-semibold">🌾 FarmTech Solutions</div>
              <div className="text-gray-400 font-semibold">🐄 LivestockPro</div>
              <div className="text-gray-400 font-semibold">🥛 DairyMax</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why AllCattle Section - NEW */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200">
              Why Choose AllCattle?
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              The Most Advanced Livestock Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built from the ground up to solve real-world challenges in livestock management with cutting-edge technology and industry expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
            <div className="space-y-8">
              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">🎯</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Industry-Specific Solution</h3>
                  <p className="text-gray-600">Unlike generic farm software, AllCattle is built specifically for livestock management with deep industry knowledge and best practices.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">🚀</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Scalable Architecture</h3>
                  <p className="text-gray-600">From single farms to enterprise operations with thousands of animals across multiple locations - our platform grows with you.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise Security</h3>
                  <p className="text-gray-600">Bank-level security with end-to-end encryption, role-based access control, and complete data sovereignty.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-xl shadow-xl p-6 transform -rotate-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-900">Farm Dashboard</h4>
                      <Badge className="bg-green-100 text-green-700">Live</Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Animals</span>
                        <span className="font-bold text-emerald-600">1,247</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Milk Production</span>
                        <span className="font-bold text-teal-600">2,450L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Health Alerts</span>
                        <span className="font-bold text-orange-600">3</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full animate-pulse" style={{width: '78%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Tenant & Company Switching Section - NEW */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 relative">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200">
              Multi-Tenant Architecture
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              One Platform, Unlimited Organizations
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Seamlessly manage multiple companies, farms, and teams with our advanced multi-tenant system. 
              Switch between organizations instantly while maintaining complete data isolation and security.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Tenant Level */}
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-blue-100 hover:border-blue-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-300">
                  🏢
                </div>
                <CardTitle className="text-2xl font-bold text-blue-700">
                  Tenant Level
                </CardTitle>
                <Badge className="mx-auto bg-blue-100 text-blue-700">Enterprise Control</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  Global oversight across all your organizations with centralized billing, user management, and system administration.
                </CardDescription>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Multi-organization management</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Centralized billing & reporting</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Global user administration</li>
                  <li className="flex items-center"><span className="text-blue-500 mr-2">✓</span> Cross-company analytics</li>
                </ul>
              </CardContent>
            </Card>

            {/* Company Level */}
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-emerald-100 hover:border-emerald-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-300">
                  🏭
                </div>
                <CardTitle className="text-2xl font-bold text-emerald-700">
                  Company Level
                </CardTitle>
                <Badge className="mx-auto bg-emerald-100 text-emerald-700">Operations Hub</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  Manage multiple farms under one company umbrella with standardized processes and unified reporting.
                </CardDescription>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="text-emerald-500 mr-2">✓</span> Multi-farm coordination</li>
                  <li className="flex items-center"><span className="text-emerald-500 mr-2">✓</span> Standardized SOPs</li>
                  <li className="flex items-center"><span className="text-emerald-500 mr-2">✓</span> Company-wide analytics</li>
                  <li className="flex items-center"><span className="text-emerald-500 mr-2">✓</span> Resource optimization</li>
                </ul>
              </CardContent>
            </Card>

            {/* Farm Level */}
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-2 border-teal-100 hover:border-teal-200">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-300">
                  🏡
                </div>
                <CardTitle className="text-2xl font-bold text-teal-700">
                  Farm Level
                </CardTitle>
                <Badge className="mx-auto bg-teal-100 text-teal-700">Daily Operations</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-base leading-relaxed">
                  Ground-level livestock management with detailed animal tracking, health monitoring, and production optimization.
                </CardDescription>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Individual animal tracking</li>
                  <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Health & reproduction monitoring</li>
                  <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Milk production tracking</li>
                  <li className="flex items-center"><span className="text-teal-500 mr-2">✓</span> Field team collaboration</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Context Switching Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Instant Context Switching</h3>
              <p className="text-gray-600">Switch between organizations, companies, and farms with one click - no page reloads, no lost work.</p>
            </div>
            
            <div className="space-y-4">
              {/* Context Switcher UI Mockup */}
              <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-blue-600 text-sm font-medium">🏢</span>
                  <span className="text-sm text-gray-700">AgriCorp Holdings</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <span className="text-gray-300">→</span>
                
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-emerald-600 text-sm font-medium">🏭</span>
                  <span className="text-sm text-gray-700">Green Valley Farms</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <span className="text-gray-300">→</span>
                
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <span className="text-teal-600 text-sm font-medium">🏡</span>
                  <span className="text-sm text-gray-700">North Pasture</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div className="text-blue-600">
                  <div className="font-bold">12 Companies</div>
                  <div className="text-gray-500">47 Farms</div>
                </div>
                <div className="text-emerald-600">
                  <div className="font-bold">8 Farms</div>
                  <div className="text-gray-500">1,247 Animals</div>
                </div>
                <div className="text-teal-600">
                  <div className="font-bold">247 Animals</div>
                  <div className="text-gray-500">85% Healthy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three-Way Connectivity Section */}
      <section className="py-20 bg-white">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-100 to-cyan-100 text-emerald-700 border-emerald-200">
              Connected Ecosystem
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Three-Way Connectivity Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AllCattle creates a unified network connecting all stakeholders in the livestock industry with real-time data synchronization and seamless collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Farm Operations */}
            <div className="relative group transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
              <Card className="relative border-2 border-emerald-100 hover:border-emerald-200 transition-all duration-300 h-full shadow-lg hover:shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-500">
                    🏡
                  </div>
                  <CardTitle className="text-2xl font-bold text-emerald-700 group-hover:text-emerald-800 transition-colors">
                    Farm Operations
                  </CardTitle>
                  <Badge className="mx-auto bg-emerald-100 text-emerald-700 group-hover:bg-emerald-200 transition-colors">
                    Field Level
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    Complete livestock management for individual farms including animal tracking, health monitoring, and production analytics with real-time field data collection.
                  </CardDescription>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center group-hover:text-emerald-700 transition-colors">
                      <span className="text-emerald-500 mr-3 text-lg">✓</span> 
                      Individual animal profiles & QR tracking
                    </li>
                    <li className="flex items-center group-hover:text-emerald-700 transition-colors">
                      <span className="text-emerald-500 mr-3 text-lg">✓</span> 
                      Health & vaccination scheduling
                    </li>
                    <li className="flex items-center group-hover:text-emerald-700 transition-colors">
                      <span className="text-emerald-500 mr-3 text-lg">✓</span> 
                      Milk production monitoring
                    </li>
                    <li className="flex items-center group-hover:text-emerald-700 transition-colors">
                      <span className="text-emerald-500 mr-3 text-lg">✓</span> 
                      Breeding cycle management
                    </li>
                    <li className="flex items-center group-hover:text-emerald-700 transition-colors">
                      <span className="text-emerald-500 mr-3 text-lg">✓</span> 
                      Mobile-first field interface
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Management Teams */}
            <div className="relative group transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 animate-pulse delay-200"></div>
              <Card className="relative border-2 border-teal-100 hover:border-teal-200 transition-all duration-300 h-full shadow-lg hover:shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-500">
                    👥
                  </div>
                  <CardTitle className="text-2xl font-bold text-teal-700 group-hover:text-teal-800 transition-colors">
                    Management Teams
                  </CardTitle>
                  <Badge className="mx-auto bg-teal-100 text-teal-700 group-hover:bg-teal-200 transition-colors">
                    Strategic Control
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    Centralized oversight and coordination across multiple farms with advanced analytics, predictive insights, and strategic decision support.
                  </CardDescription>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center group-hover:text-teal-700 transition-colors">
                      <span className="text-teal-500 mr-3 text-lg">✓</span> 
                      Multi-farm dashboard & KPIs
                    </li>
                    <li className="flex items-center group-hover:text-teal-700 transition-colors">
                      <span className="text-teal-500 mr-3 text-lg">✓</span> 
                      Predictive analytics & insights
                    </li>
                    <li className="flex items-center group-hover:text-teal-700 transition-colors">
                      <span className="text-teal-500 mr-3 text-lg">✓</span> 
                      Resource allocation optimization
                    </li>
                    <li className="flex items-center group-hover:text-teal-700 transition-colors">
                      <span className="text-teal-500 mr-3 text-lg">✓</span> 
                      Team collaboration tools
                    </li>
                    <li className="flex items-center group-hover:text-teal-700 transition-colors">
                      <span className="text-teal-500 mr-3 text-lg">✓</span> 
                      Performance benchmarking
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Supply Chain Partners */}
            <div className="relative group transform hover:scale-105 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 animate-pulse delay-400"></div>
              <Card className="relative border-2 border-cyan-100 hover:border-cyan-200 transition-all duration-300 h-full shadow-lg hover:shadow-2xl">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl group-hover:rotate-12 transition-transform duration-500">
                    🚛
                  </div>
                  <CardTitle className="text-2xl font-bold text-cyan-700 group-hover:text-cyan-800 transition-colors">
                    Supply Partners
                  </CardTitle>
                  <Badge className="mx-auto bg-cyan-100 text-cyan-700 group-hover:bg-cyan-200 transition-colors">
                    Network Integration
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    Seamless integration with feed suppliers, veterinary services, and processing facilities for efficient operations and supply chain transparency.
                  </CardDescription>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-center group-hover:text-cyan-700 transition-colors">
                      <span className="text-cyan-500 mr-3 text-lg">✓</span> 
                      Feed supplier API integration
                    </li>
                    <li className="flex items-center group-hover:text-cyan-700 transition-colors">
                      <span className="text-cyan-500 mr-3 text-lg">✓</span> 
                      Veterinary scheduling system
                    </li>
                    <li className="flex items-center group-hover:text-cyan-700 transition-colors">
                      <span className="text-cyan-500 mr-3 text-lg">✓</span> 
                      Processing facility coordination
                    </li>
                    <li className="flex items-center group-hover:text-cyan-700 transition-colors">
                      <span className="text-cyan-500 mr-3 text-lg">✓</span> 
                      Supply chain transparency
                    </li>
                    <li className="flex items-center group-hover:text-cyan-700 transition-colors">
                      <span className="text-cyan-500 mr-3 text-lg">✓</span> 
                      Automated ordering & delivery
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Connection Diagram */}
          <div className="relative mt-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Real-Time Data Flow</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Watch how data flows seamlessly between all stakeholders in real-time, creating a truly connected ecosystem.
              </p>
            </div>
            
            <div className="relative max-w-5xl mx-auto">
              {/* Animated Connection Lines */}
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 800 300">
                  <defs>
                    <linearGradient id="connectionGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981"/>
                      <stop offset="50%" stopColor="#06b6d4"/>
                      <stop offset="100%" stopColor="#3b82f6"/>
                    </linearGradient>
                    <linearGradient id="connectionGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4"/>
                      <stop offset="50%" stopColor="#3b82f6"/>
                      <stop offset="100%" stopColor="#6366f1"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Main connection lines */}
                  <path 
                    d="M 150 150 Q 400 100 650 150" 
                    stroke="url(#connectionGradient1)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10" 
                    opacity="0.8"
                    className="animate-pulse"
                  />
                  <path 
                    d="M 150 150 Q 400 200 650 150" 
                    stroke="url(#connectionGradient2)" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="15,10" 
                    opacity="0.8"
                    className="animate-pulse"
                    style={{animationDelay: '1s'}}
                  />
                  
                  {/* Data flow animations */}
                  <circle r="6" fill="#10b981" opacity="0.8">
                    <animateMotion dur="3s" repeatCount="indefinite" rotate="auto">
                      <path d="M 150 150 Q 400 100 650 150"/>
                    </animateMotion>
                  </circle>
                  <circle r="6" fill="#06b6d4" opacity="0.8">
                    <animateMotion dur="3s" repeatCount="indefinite" rotate="auto" begin="1s">
                      <path d="M 650 150 Q 400 200 150 150"/>
                    </animateMotion>
                  </circle>
                </svg>
              </div>
              
              {/* Connection Points */}
              <div className="grid grid-cols-3 gap-8 items-center relative z-10">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl shadow-xl animate-bounce">
                    🏡
                  </div>
                  <h4 className="font-bold text-emerald-700 mb-2">Farm Operations</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Live Data</span>
                    </div>
                    <div>24/7 Monitoring</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-3xl shadow-xl animate-bounce delay-300">
                    👥
                  </div>
                  <h4 className="font-bold text-teal-700 mb-2">Management Hub</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                      <span>Analytics</span>
                    </div>
                    <div>Decision Support</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-3xl shadow-xl animate-bounce delay-700">
                    🚛
                  </div>
                  <h4 className="font-bold text-cyan-700 mb-2">Supply Network</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                      <span>Integration</span>
                    </div>
                    <div>Automation</div>
                  </div>
                </div>
              </div>
              
              {/* Data Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">99.9%</div>
                  <div className="text-sm text-emerald-700">Data Accuracy</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-xl">
                  <div className="text-2xl font-bold text-teal-600">&lt;2s</div>
                  <div className="text-sm text-teal-700">Response Time</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-xl">
                  <div className="text-2xl font-bold text-cyan-600">24/7</div>
                  <div className="text-sm text-cyan-700">Real-time Sync</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-sm text-blue-700">Secure Transfer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Livestock Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to optimize your livestock operations with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xl">
                  🐄
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Animal Profiling & Tracking
                </CardTitle>
                <CardDescription className="text-base">
                  Complete digital profiles for each animal including genetics, health history, and performance metrics with real-time tracking capabilities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📊
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                  Advanced Health Monitoring
                </CardTitle>
                <CardDescription className="text-base">
                  Proactive health management with vaccination schedules, treatment tracking, and early disease detection systems.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white text-xl">
                  🥛
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                  Production Analytics
                </CardTitle>
                <CardDescription className="text-base">
                  Detailed milk production tracking, breeding cycle optimization, and reproductive health monitoring with predictive insights.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📱
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Mobile-First Design
                </CardTitle>
                <CardDescription className="text-base">
                  Access your farm data anywhere with our responsive, mobile-optimized interface designed for field work and remote monitoring.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xl">
                  🏢
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  Multi-Tenant Architecture
                </CardTitle>
                <CardDescription className="text-base">
                  Scalable platform supporting multiple farms, companies, and organizations with role-based access control and data isolation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-xl">
                  📈
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Business Intelligence
                </CardTitle>
                <CardDescription className="text-base">
                  Comprehensive reporting, predictive analytics, and actionable insights to optimize farm operations and maximize profitability.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Livestock Management?
            </h2>
            <p className="text-xl text-emerald-100 mb-10 max-w-3xl mx-auto">
              Join thousands of farmers, managers, and suppliers who trust AllCattle to streamline their operations and maximize their success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-white text-emerald-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300" asChild>
                <Link href="/auth/signin">
                  Start Free Trial
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-emerald-600 transition-all duration-300" asChild>
                <Link href="/contact">
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <span className="text-3xl font-bold text-white">🐄 AllCattle</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Connecting farms, managers, and suppliers in a unified livestock management ecosystem. 
                Building the future of sustainable agriculture.
              </p>
              <div className="flex space-x-4">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  Twitter
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  LinkedIn
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  GitHub
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 AllCattle Farm. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Terms of Service
                </Link>
                <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Cookie Policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
