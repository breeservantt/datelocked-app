import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

export default function NightIn() {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [state, setState] = useState(null)
  const [loading, setLoading] = useState(true)

  // ✅ LOAD USER + SESSION
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user
      setUser(currentUser)

      if (!currentUser?.user_metadata?.couple_profile_id) {
        setLoading(false)
        return
      }

      const coupleId = currentUser.user_metadata.couple_profile_id

      // GET OR CREATE SESSION
      let { data: sessions } = await supabase
        .from('NightInSession')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .eq('status', 'IN_PROGRESS')

      let activeSession = sessions?.[0]

      if (!activeSession) {
        const { data } = await supabase
          .from('NightInSession')
          .insert({
            couple_profile_id: coupleId,
            status: 'IN_PROGRESS',
            host_user_id: currentUser.id
          })
          .select()
          .single()

        activeSession = data
      }

      setSession(activeSession)

      // GET OR CREATE STATE
      let { data: states } = await supabase
        .from('NightInState')
        .select('*')
        .eq('session_id', activeSession.id)

      let activeState = states?.[0]

      if (!activeState) {
        const { data } = await supabase
          .from('NightInState')
          .insert({
            session_id: activeSession.id,
            couple_profile_id: coupleId,
            payload: {},
            version: 1
          })
          .select()
          .single()

        activeState = data
      }

      setState(activeState)
      setLoading(false)
    })()
  }, [])

  // ✅ SIMPLE UPDATE
  const updateState = async (newPayload) => {
    const nextVersion = (state.version || 0) + 1

    const { data } = await supabase
      .from('NightInState')
      .update({
        payload: newPayload,
        version: nextVersion
      })
      .eq('id', state.id)
      .select()
      .single()

    setState(data)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  if (!user?.user_metadata?.couple_profile_id) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>NightIn</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You must be Date-Locked to use this feature.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>NightIn</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* SIMPLE STATE DISPLAY */}
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(state.payload, null, 2)}
          </pre>

          {/* TEST BUTTON */}
          <Button
            onClick={() =>
              updateState({
                message: 'Hello from Date-Locked ❤️',
                updated_at: new Date().toISOString()
              })
            }
          >
            Update State
          </Button>

        </CardContent>
      </Card>
    </div>
  )
}
