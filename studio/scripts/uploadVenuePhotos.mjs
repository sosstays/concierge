import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})

const TYPES = ['foodVenue', 'attractionVenue', 'travelVenue']

async function run() {
  for (const type of TYPES) {
    const docs = await client.fetch(
      `*[_type == $type && defined(photoUrl) && !defined(photo)]{_id, name, photoUrl}`,
      {type},
    )
    console.log(`\n${type}: ${docs.length} to process`)
    for (const doc of docs) {
      try {
        const res = await fetch(doc.photoUrl)
        if (!res.ok) {
          console.error(`  ✖ ${doc.name}: fetch failed (${res.status})`)
          continue
        }
        const arrayBuffer = await res.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const asset = await client.assets.upload('image', buffer, {
          filename: `${doc._id}.jpg`,
        })
        await client
          .patch(doc._id)
          .set({photo: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}})
          .commit()
        console.log(`  ✔ ${doc.name} -> ${asset._id}`)
      } catch (err) {
        console.error(`  ✖ ${doc.name}: ${err.message}`)
      }
    }
  }
}

run()
  .then(() => console.log('\nDone.'))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
